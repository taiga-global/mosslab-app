import { Injectable, InternalServerErrorException } from '@nestjs/common';
import FormData from 'form-data';
import fetch, { Response } from 'node-fetch';
import Replicate from 'replicate';
import { z } from 'zod';

/* ──────────────────── 런타임-검증 스키마 ──────────────────── */
const UrlSchema = z.string().url();

const Api2CreateSchema = z.object({ job: z.string() });

const Api2StatusSchema = z.object({
  status: z.enum(['successful', 'failed', 'processing']),
  output: z.object({ url: z.string().url() }).optional(),
});

/* 안전한 JSON 파서 */
async function safeJson<T>(res: Response, schema: z.ZodSchema<T>): Promise<T> {
  const data: unknown = await res.json();
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new InternalServerErrorException('Unexpected API response');
  }
  return parsed.data;
}

/* ─────────────────────── 서비스 ─────────────────────── */
@Injectable()
export class ReplicateService {
  private replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
  });

  /** 최종 64×32 GIF Buffer 반환 */
  async makeGif(imageUrl: string): Promise<Buffer> {
    const cleaned = await this.fluxKontextPro(imageUrl);
    const mp4 = await this.seedancePro(cleaned);
    return this.mp4ToGif(mp4);
  }

  /* 1️⃣ 배경 제거 */
  private async fluxKontextPro(img: string): Promise<string> {
    const out = await this.replicate.run('black-forest-labs/flux-kontext-pro', {
      input: {
        prompt:
          'Make the background solid black with absolutely nothing else in it, rendered as a 90s cartoon.',
        input_image: img,
        output_format: 'jpg',
      },
    });

    return UrlSchema.parse(out); // ← 단언 대신 검증
  }

  /* 2️⃣ Seedance-1-Pro */
  private async seedancePro(img: string): Promise<string> {
    const out = await this.replicate.run('bytedance/seedance-1-pro', {
      input: {
        fps: 24,
        image: img,
        prompt: 'Animate',
        duration: 10,
        resolution: '480p',
      },
    });

    return UrlSchema.parse(out);
  }

  /* 3️⃣ api2convert → GIF */
  private async mp4ToGif(mp4: string): Promise<Buffer> {
    const form = new FormData();
    form.append('input[0][type]', 'remote');
    form.append('input[0][source]', mp4);
    form.append('conversion[0][category]', 'image');
    form.append('conversion[0][target]', 'gif');
    form.append('conversion[0][options][width]', '64');
    form.append('conversion[0][options][height]', '32');

    const createRes = await fetch('https://api.api2convert.com/v2/jobs', {
      method: 'POST',
      headers: {
        'x-oc-api-key': process.env.API2CONVERT_API_KEY!,
        ...form.getHeaders(),
      },
      body: form,
    });

    if (!createRes.ok)
      throw new InternalServerErrorException(createRes.statusText);

    const { job } = await safeJson(createRes, Api2CreateSchema);

    /* ------ 폴링 ------ */
    const statusUrl = `https://api.api2convert.com/v2/jobs/${job}`;
    let gifUrl: string | undefined;

    while (!gifUrl) {
      const statusRes = await fetch(statusUrl, {
        headers: { 'x-oc-api-key': process.env.API2CONVERT_API_KEY! },
      });
      const data = await safeJson(statusRes, Api2StatusSchema);

      if (data.status === 'failed')
        throw new InternalServerErrorException('Conversion failed');

      if (data.status === 'successful' && data.output) gifUrl = data.output.url;
      else await new Promise((r) => setTimeout(r, 1500));
    }

    /* GIF 다운로드 */
    const gifRes = await fetch(gifUrl);
    if (!gifRes.ok)
      throw new InternalServerErrorException('GIF download failed');

    return gifRes.buffer();
  }
}
