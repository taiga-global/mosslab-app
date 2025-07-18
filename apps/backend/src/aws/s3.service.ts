import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';

@Injectable()
export class S3Service {
  private s3 = new S3Client({});
  private bucket = process.env.AWS_S3_BUCKET;

  /** 업로드용 URL (5 분) */
  async getUploadUrl(key: string, mime = 'image/jpeg') {
    return await getSignedUrl(
      this.s3,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: mime,
      }),
      { expiresIn: 60 * 5 },
    );
  }

  /** 다운로드용 URL (5 분) */
  async getDownloadUrl(key: string) {
    return await getSignedUrl(
      this.s3,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: 60 * 5 },
    );
  }

  /** S3에 파일 업로드 */
  async uploadImage(buffer: Buffer, mime: string, key: string) {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mime,
      }),
    );
  }
}
