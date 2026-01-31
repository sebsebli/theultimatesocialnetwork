import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as MinIO from 'minio';
import sharp, { type ResizeOptions } from 'sharp';
import { encode } from 'blurhash';
import { v4 as uuidv4 } from 'uuid';
import { SafetyService } from '../safety/safety.service';

/**
 * Incoming file from multer. Only buffer, mimetype and size are used.
 * Original filename is never used for storage—all keys are UUID-based.
 */
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

/** All stored images use this extension; we never keep the user's original format. */
const STORED_IMAGE_EXT = '.webp';

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
    this.bucketName =
      this.configService.get('MINIO_BUCKET') || 'citewalk-images';
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

  /**
   * Process and store an image. We never keep the original:
   * - Key is always UUID-based (no user filenames).
   * - Output is always WebP, compressed; original format is discarded.
   * - EXIF and other metadata are stripped.
   */
  private async processAndUpload(
    file: UploadedImageFile,
    resizeOptions: ResizeSpec,
    generateBlurhash: boolean,
  ): Promise<{ key: string; blurhash?: string }> {
    if (!file.mimetype.match(/^image\/(jpeg|jpg|webp|png)$/)) {
      throw new BadRequestException(
        'Only JPG, WEBP, and PNG images are allowed',
      );
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('File size must be less than 10MB');
    }

    const safety = await this.safetyService.checkImage(file.buffer);
    if (!safety.safe) {
      throw new BadRequestException(
        safety.reason || 'Image failed safety check',
      );
    }

    const image = sharp(file.buffer);

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

    const sharpResize: ResizeOptions = {
      width: resizeOptions.width,
      height: resizeOptions.height ?? undefined,
      withoutEnlargement: true,
      fit: resizeOptions.fit,
    };

    // Single format: WebP, compressed. Sharp strips all metadata (EXIF, etc.) by default.
    const processedImage = await image
      .rotate() // apply EXIF orientation before resize, then metadata is not re-encoded
      .resize(sharpResize)
      .webp({ quality: 85 })
      .toBuffer();

    const key = `uploads/${uuidv4()}${STORED_IMAGE_EXT}`;

    await this.minioClient.putObject(
      this.bucketName,
      key,
      processedImage,
      processedImage.length,
      { 'Content-Type': 'image/webp' },
    );

    return { key, blurhash: blurhashStr };
  }

  /**
   * URL for clients to load an image. Prefer API_URL so mobile/app can load via API (single origin).
   * When API_URL is set, returns API_URL/images/key; otherwise MinIO direct (MINIO_PUBLIC_URL/bucket/key).
   */
  getImageUrl(key: string): string {
    const apiBase =
      this.configService.get<string>('API_URL')?.replace(/\/$/, '') ||
      this.configService.get<string>('PUBLIC_API_URL')?.replace(/\/$/, '');
    if (apiBase) {
      return `${apiBase}/images/${encodeURIComponent(key)}`;
    }
    const publicUrl =
      this.configService.get<string>('MINIO_PUBLIC_URL') ??
      'http://localhost:9000';
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

  /** Get a readable stream for an image by key (for GET /images/*). */
  getImageStream(key: string): Promise<NodeJS.ReadableStream> {
    return this.minioClient.getObject(
      this.bucketName,
      key,
    ) as Promise<NodeJS.ReadableStream>;
  }
}
