// src/replicate/replicate.service.ts
import { Injectable } from '@nestjs/common';
import fetch from 'node-fetch';
@Injectable()
export class ReplicateService {
  async makeGif(imageUrl: string): Promise<ArrayBuffer> {
    // Replicate API 호출 예시
    const res = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        Authorization: `Token ${process.env.REPLICATE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'aicapcut/stable-video-diffusion-img2vid-xt-optimized',
        input: { image: imageUrl },
      }),
    }).then((r) => r.json());

    // 결과 gif URL 얻었다고 가정
    const gifUrl = res.output.gif;
    return fetch(gifUrl).then((r) => r.arrayBuffer());
  }
}
