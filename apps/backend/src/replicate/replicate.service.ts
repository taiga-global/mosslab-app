import { Injectable, InternalServerErrorException } from '@nestjs/common';
import fetch, { Response } from 'node-fetch';
import Replicate, { FileOutput } from 'replicate';
import { z } from 'zod';

/* ─────────────── api2convert 응답 스키마 ─────────────── */
const Api2CreateSchema = z.object({ id: z.string() }); // ← id
const Api2StatusSchema = z.object({
  status: z.object({ code: z.string() }), // ← status.code
  output: z.array(z.object({ uri: z.string().url() })).optional(), // ← output[].uri
});

/* ─────────────── 공통 헬퍼 ─────────────── */
async function safeJson<T>(res: Response, schema: z.ZodSchema<T>): Promise<T> {
  const data: unknown = await res.json();
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new InternalServerErrorException('Unexpected API response');
  }
  return parsed.data;
}

function toUrl(val: unknown): string {
  /* 단일 문자열 */
  if (typeof val === 'string') return val;

  /* FileOutput */
  if (val && typeof (val as FileOutput).url === 'function')
    return (val as FileOutput).url().href;

  /* 문자열/파일 배열 */
  if (Array.isArray(val) && val.length) return toUrl(val[0]);

  throw new Error('Unsupported output type from Replicate');
}

/* ─────────────────── 서비스 ─────────────────── */
@Injectable()
export class ReplicateService {
  private replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
  });

  /** S3 원본 → 64×32 GIF (Buffer) */
  async makeGif(imageUrl: string): Promise<Buffer> {
    const cleaned = await this.fluxKontextPro(imageUrl);
    const mp4 = await this.seedancePro(cleaned);
    return this.mp4ToGif(mp4);
  }

  /* 1️⃣ Flux-Kontext-Pro → JPG URL */
  private async fluxKontextPro(src: string): Promise<string> {
    const out = await this.replicate.run('black-forest-labs/flux-kontext-pro', {
      input: {
        prompt:
          'Make the background solid black with absolutely nothing else in it, rendered as a 90s cartoon.',
        input_image: src,
        output_format: 'jpg',
      },
    });
    const url = toUrl(out);
    console.log(url);
    return url;
  }

  /* 2️⃣ Seedance-1-Pro → MP4 URL */
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
    const url = toUrl(out);
    console.log(url);
    return url;
  }

  /* 3️⃣ api2convert : MP4 → 64×32 GIF(Buffer) */
  private async mp4ToGif(mp4Url: string): Promise<Buffer> {
    /* 3-1 Job 생성 */
    // const form = new FormData();
    // form.append('input[0][type]', 'remote');
    // form.append('input[0][source]', mp4Url);
    // form.append('conversion[0][category]', 'image');
    // form.append('conversion[0][target]', 'gif');
    // form.append('conversion[0][options][width]', '64');
    // form.append('conversion[0][options][height]', '32');

    const createRes = await fetch('https://api.api2convert.com/v2/jobs', {
      method: 'POST',
      headers: {
        'x-oc-api-key': process.env.API2CONVERT_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: [
          {
            type: 'remote',
            source: mp4Url,
          },
        ],
        conversion: [
          {
            category: 'image',
            target: 'gif',
            options: {
              width: 64,
              height: 32,
            },
          },
        ],
      }),
    });
    if (!createRes.ok)
      throw new InternalServerErrorException(createRes.statusText);

    const { id } = await safeJson(createRes, Api2CreateSchema); // ← id 사용

    /* 3-2 상태 polling */
    const statusUrl = `https://api.api2convert.com/v2/jobs/${id}`;
    let gifUrl: string | undefined;

    while (!gifUrl) {
      const res = await fetch(statusUrl, {
        headers: { 'x-oc-api-key': process.env.API2CONVERT_API_KEY! },
      });
      const data = await safeJson(res, Api2StatusSchema);

      const code = data.status.code;
      if (code === 'failed')
        throw new InternalServerErrorException('Conversion failed');

      if (code === 'completed' && data.output?.length)
        gifUrl = data.output[0].uri;
      else await new Promise((r) => setTimeout(r, 1500)); // processing 등
    }

    /* 3-3 GIF 다운로드 */
    const gifRes = await fetch(gifUrl);
    if (!gifRes.ok)
      throw new InternalServerErrorException('GIF download failed');

    return gifRes.buffer();
  }
}
