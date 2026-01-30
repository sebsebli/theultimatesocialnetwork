import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as MinIO from 'minio';
import sharp, { type ResizeOptions } from 'sharp';
import { encode } from 'blurhash';
import { v4 as uuidv4 } from 'uuid';
import { SafetyService } from '../safety/safety.service';

export interface UploadedImageFile {
  mimetype: string;
  size: number;
  buffer: Buffer;
}

interface ResizeSpec {
  width: number;
  height: number | null;
  fit: 'inside' | 'cover';
}

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

  async uploadHeaderImage(
    file: UploadedImageFile,
  ): Promise<{ key: string; blurhash?: string }> {
    return this.processAndUpload(
      file,
      { width: 1600, height: null, fit: 'inside' },
      true,
    );
  }

  async uploadProfilePicture(file: UploadedImageFile): Promise<string> {
    const result = await this.processAndUpload(
      file,
      { width: 400, height: 400, fit: 'cover' },
      false,
    );
    return result.key;
  }

  /** Profile header/cover image (e.g. from draw or upload). Wide aspect. */
  async uploadProfileHeader(file: UploadedImageFile): Promise<string> {
    const result = await this.processAndUpload(
      file,
      { width: 1200, height: 300, fit: 'cover' },
      false,
    );
    return result.key;
  }

  private async processAndUpload(
    file: UploadedImageFile,
    resizeOptions: ResizeSpec,
    generateBlurhash: boolean,
  ): Promise<{ key: string; blurhash?: string }> {
    // Validate file type
    if (!file.mimetype.match(/^image\/(jpeg|jpg|webp|png)$/)) {
      throw new BadRequestException(
        'Only JPG, WEBP, and PNG images are allowed',
      );
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('File size must be less than 10MB');
    }

    // AI Safety Check
    const safety = await this.safetyService.checkImage(file.buffer);
    if (!safety.safe) {
      throw new BadRequestException(
        safety.reason || 'Image failed safety check',
      );
    }

    const image = sharp(file.buffer);

    // Generate Blurhash if requested
    let blurhashStr: string | undefined;
    if (generateBlurhash) {
      const { data, info } = await image
        .clone()
        .raw()
        .ensureAlpha()
        .resize(32, 32, { fit: 'inside' })
        .toBuffer({ resolveWithObject: true });

      blurhashStr = encode(
        new Uint8ClampedArray(data),
        info.width,
        info.height,
        4,
        4,
      );
    }

    // Process image: compress, strip EXIF, resize
    const sharpResize: ResizeOptions = {
      width: resizeOptions.width,
      height: resizeOptions.height ?? undefined,
      withoutEnlargement: true,
      fit: resizeOptions.fit,
    };
    const processedImage = await image
      .resize(sharpResize)
      .webp({ quality: 85 })
      .toBuffer();

    // Generate unique key
    const key = `uploads/${uuidv4()}.webp`;

    // Upload to MinIO
    await this.minioClient.putObject(
      this.bucketName,
      key,
      processedImage,
      processedImage.length,
      {
        'Content-Type': 'image/webp',
      },
    );

    return { key, blurhash: blurhashStr };
  }

  getImageUrl(key: string): string {
    const publicUrl =
      this.configService.get<string>('MINIO_PUBLIC_URL') ??
      'http://localhost:9000';
    // Remove trailing slash if present
    const baseUrl = publicUrl.endsWith('/')
      ? publicUrl.slice(0, -1)
      : publicUrl;
    return `${baseUrl}/${this.bucketName}/${key}`;
  }

  /** Upload a data export zip buffer to storage. Returns the storage key. */
  async uploadExportZip(buffer: Buffer): Promise<string> {
    const key = `exports/${uuidv4()}.zip`;
    await this.minioClient.putObject(
      this.bucketName,
      key,
      buffer,
      buffer.length,
      { 'Content-Type': 'application/zip' },
    );
    return key;
  }

  /** Get a readable stream for an export file by key (for download). */
  getExportStream(key: string): Promise<NodeJS.ReadableStream> {
    return this.minioClient.getObject(
      this.bucketName,
      key,
    ) as Promise<NodeJS.ReadableStream>;
  }
}
