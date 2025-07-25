// src/backup/backup.service.ts
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import fetch from 'node-fetch';
import { Readable } from 'node:stream';
import { ReadableStream as NodeReadableStream } from 'node:stream/web';

@Injectable()
export class BackupService {
  private s3 = new S3Client({ region: process.env.AWS_REGION });
  private bucket = process.env.AWS_S3_BUCKET;

  async copyFromUrl(
    srcUrl: string,
    dstKey: string,
    mimeType: string,
  ): Promise<void> {
    /* 1. 다운로드 스트림 확보 */
    const res = await fetch(srcUrl);
    if (!res.ok) {
      throw new InternalServerErrorException(
        `Download failed: ${res.status} ${res.statusText}`,
      );
    }

    if (!res.ok) {
      throw new InternalServerErrorException(
        `Download failed: ${res.status} ${res.statusText}`,
      );
    }

    if (!res.body) {
      throw new InternalServerErrorException('Response body is null');
    }

    const nodeStream = Readable.fromWeb(
      res.body as unknown as NodeReadableStream<any>,
    );
    /* 3. S3 스트리밍 업로드 (메모리 O(1)) */
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: dstKey,
        Body: nodeStream,
        ContentType: mimeType,
      }),
    );
  }
}
