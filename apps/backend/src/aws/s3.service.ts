// import { Injectable } from '@nestjs/common';

// @Injectable()
// export class S3Service {}

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';

@Injectable()
export class S3Service {
  private s3 = new S3Client({ region: 'ap-northeast-2' });

  async generateUploadUrl(key: string) {
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      ContentType: 'image/jpeg', // 또는 'image/png'
    });
    return getSignedUrl(this.s3, command, { expiresIn: 60 * 5 });
  }
}
