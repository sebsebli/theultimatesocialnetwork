import {
  Injectable,
  BadRequestException,
  Logger,
  OnModuleInit,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as MinIO from 'minio';
import sharp, { type ResizeOptions } from 'sharp';
import { encode } from 'blurhash';
import { v4 as uuidv4 } from 'uuid';
import { SafetyService } from '../safety/safety.service';
import { IEventBus, EVENT_BUS } from '../common/event-bus/event-bus.interface';
import type { ImageUploadType } from './image-moderation.worker';

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
export class UploadService implements OnModuleInit {
  private readonly logger = new Logger(UploadService.name);
  private minioClient: MinIO.Client;
  private bucketName: string;

  constructor(
    private configService: ConfigService,
    private safetyService: SafetyService,
    @Inject(EVENT_BUS)
    private eventBus: IEventBus,
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

  async onModuleInit(): Promise<void> {
    await this.ensureBucket();
  }

  /** Ensure the MinIO bucket exists; create it if not. Safe to call repeatedly. */
  private async ensureBucket(): Promise<void> {
    try {
      const exists = await this.minioClient.bucketExists(this.bucketName);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucketName);
        this.logger.log(`MinIO bucket "${this.bucketName}" created.`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const code = (err as { code?: string })?.code;
      const isBucketMissing =
        code === 'NoSuchBucket' ||
        code === 'NotFound' ||
        msg.includes('does not exist') ||
        msg.includes('NoSuchBucket');
      if (isBucketMissing) {
        try {
          await this.minioClient.makeBucket(this.bucketName);
          this.logger.log(
            `MinIO bucket "${this.bucketName}" created (after missing).`,
          );
        } catch (makeErr) {
          this.logger.warn(
            `MinIO makeBucket failed: ${makeErr instanceof Error ? makeErr.message : String(makeErr)}`,
          );
        }
        return;
      }
      this.logger.warn(
        `MinIO bucket "${this.bucketName}" check failed: ${msg}. Uploads may retry bucket creation.`,
      );
    }
  }

  async uploadHeaderImage(
    file: UploadedImageFile,
    userId: string,
  ): Promise<{ key: string; blurhash?: string }> {
    return this.processAndUpload(
      file,
      { width: 1600, height: null, fit: 'inside' },
      true,
      { uploadType: 'header_image', userId },
    );
  }

  async uploadProfilePicture(
    file: UploadedImageFile,
    userId: string,
  ): Promise<string> {
    const result = await this.processAndUpload(
      file,
      { width: 400, height: 400, fit: 'cover' },
      false,
      { uploadType: 'profile_picture', userId },
    );
    return result.key;
  }

  /** Profile header/cover image (e.g. from draw or upload). Wide aspect. */
  async uploadProfileHeader(
    file: UploadedImageFile,
    userId: string,
  ): Promise<string> {
    const result = await this.processAndUpload(
      file,
      { width: 1200, height: 300, fit: 'cover' },
      false,
      { uploadType: 'profile_header', userId },
    );
    return result.key;
  }

  /**
   * Process and store an image. We never keep the original:
   * - Key is always UUID-based (no user filenames).
   * - Output is always WebP, compressed; original format is discarded.
   * - EXIF and other metadata are stripped.
   * When MODERATION_IMAGE_ASYNC=true and options.uploadType/userId are set,
   * image is stored first and moderation runs in a background worker (scales to thousands of uploads).
   */
  private async processAndUpload(
    file: UploadedImageFile,
    resizeOptions: ResizeSpec,
    generateBlurhash: boolean,
    options?: { uploadType: ImageUploadType; userId: string },
  ): Promise<{ key: string; blurhash?: string }> {
    if (!file.mimetype.match(/^image\/(jpeg|jpg|webp|png)$/)) {
      throw new BadRequestException(
        'Only JPG, WEBP, and PNG images are allowed',
      );
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('File size must be less than 10MB');
    }

    // Prefer async when queue and upload context exist (unless explicitly disabled). Default: immediate upload, async moderation.
    const asyncExplicitlyDisabled =
      this.configService.get<string>('MODERATION_IMAGE_ASYNC') === 'false';
    const moderationAsync =
      !asyncExplicitlyDisabled &&
      !!options?.uploadType &&
      !!options?.userId;

    if (!moderationAsync) {
      const safety = await this.safetyService.checkImage(file.buffer);
      if (!safety.safe) {
        throw new BadRequestException(
          safety.reason || 'Image failed safety check',
        );
      }
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

    try {
      await this.minioClient.putObject(
        this.bucketName,
        key,
        processedImage,
        processedImage.length,
        { 'Content-Type': 'image/webp' },
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const code = (err as { code?: string })?.code;
      const isBucketMissing =
        code === 'NoSuchBucket' ||
        code === 'NotFound' ||
        msg.includes('does not exist') ||
        msg.includes('NoSuchBucket');
      if (isBucketMissing) {
        await this.ensureBucket();
        await this.minioClient.putObject(
          this.bucketName,
          key,
          processedImage,
          processedImage.length,
          { 'Content-Type': 'image/webp' },
        );
      } else {
        throw err;
      }
    }

    if (moderationAsync && options?.uploadType && options?.userId) {
      await this.eventBus.publish('image-moderation', 'moderate', {
        key,
        uploadType: options.uploadType,
        userId: options.userId,
      });
    }

    return { key, blurhash: blurhashStr };
  }

  /**
   * Public URL for any image by key. Used in all API responses so clients (web, mobile) can
   * use the same URL without building it. Prefer PUBLIC_API_URL (what clients use to reach
   * the API); fall back to API_URL, then MinIO direct. Set PUBLIC_API_URL in Docker/env to
   * the same value as EXPO_PUBLIC_API_BASE_URL / NEXT_PUBLIC_API_URL (e.g. http://localhost/api).
   */
  getImageUrl(key: string): string {
    const publicApiBase =
      this.configService.get<string>('PUBLIC_API_URL')?.replace(/\/$/, '') ||
      this.configService.get<string>('API_URL')?.replace(/\/$/, '');
    if (publicApiBase) {
      // Nest uses setGlobalPrefix('api'), so images are at /api/images/:key
      const path =
        publicApiBase.endsWith('/api')
          ? `/images/${encodeURIComponent(key)}`
          : `/api/images/${encodeURIComponent(key)}`;
      return `${publicApiBase}${path}`;
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

  /** Get image bytes by key (for async moderation worker). Returns null if object not found. */
  async getImageBuffer(key: string): Promise<Buffer | null> {
    try {
      const stream = await this.minioClient.getObject(this.bucketName, key);
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk as Uint8Array));
      }
      return Buffer.concat(chunks);
    } catch {
      return null;
    }
  }

  /**
   * Remove an uploaded file by key. Only keys under uploads/ are allowed (e.g. header images
   * uploaded in composer that were never used). Used when user removes the image or leaves without publishing.
   */
  async removeUpload(key: string): Promise<void> {
    if (!key || typeof key !== 'string' || !key.startsWith('uploads/')) {
      throw new BadRequestException('Invalid or disallowed upload key');
    }
    await this.minioClient.removeObject(this.bucketName, key);
  }
}
