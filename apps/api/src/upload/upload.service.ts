import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as MinIO from 'minio';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { SafetyService } from '../safety/safety.service';

@Injectable()
export class UploadService {
  private minioClient: MinIO.Client;
  private bucketName: string;

  constructor(
    private configService: ConfigService,
    private safetyService: SafetyService,
  ) {
    this.minioClient = new MinIO.Client({
      endPoint: this.configService.get('MINIO_ENDPOINT') || 'localhost',
      port: parseInt(this.configService.get('MINIO_PORT') || '9000'),
      useSSL: this.configService.get('MINIO_USE_SSL') === 'true',
      accessKey: this.configService.get('MINIO_ACCESS_KEY') || 'minioadmin',
      secretKey: this.configService.get('MINIO_SECRET_KEY') || 'minioadmin',
    });
    this.bucketName = this.configService.get('MINIO_BUCKET') || 'cite-images';
  }

  async uploadHeaderImage(file: any): Promise<string> {
    return this.processAndUpload(file, { width: 1600, height: null, fit: 'inside' });
  }

  async uploadProfilePicture(file: any): Promise<string> {
    return this.processAndUpload(file, { width: 400, height: 400, fit: 'cover' });
  }

  private async processAndUpload(file: any, resizeOptions: any): Promise<string> {
    // Validate file type
    if (!file.mimetype.match(/^image\/(jpeg|jpg|webp|png)$/)) {
      throw new BadRequestException('Only JPG, WEBP, and PNG images are allowed');
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('File size must be less than 10MB');
    }

    // AI Safety Check
    const safety = await this.safetyService.checkImage(file.buffer);
    if (!safety.safe) {
      throw new BadRequestException(safety.reason || 'Image failed safety check');
    }

    // Process image: compress, strip EXIF, resize
    const processedImage = await sharp(file.buffer)
      .resize(resizeOptions.width, resizeOptions.height, {
        withoutEnlargement: true,
        fit: resizeOptions.fit,
      })
      .webp({ quality: 85 })
      .toBuffer();

    // Generate unique key
    const key = `uploads/${uuidv4()}.webp`;

    // Upload to MinIO
    await this.minioClient.putObject(this.bucketName, key, processedImage, processedImage.length, {
      'Content-Type': 'image/webp',
    });

    return key;
  }

  async getImageUrl(key: string): Promise<string> {
    // In production, this would return a presigned URL or CDN URL
    return `${this.configService.get('MINIO_PUBLIC_URL') || 'http://localhost:9000'}/${this.bucketName}/${key}`;
  }
}
