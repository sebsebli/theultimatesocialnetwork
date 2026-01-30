import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { UploadService } from './upload.service';

/**
 * Serves image URLs by redirecting to storage (MinIO).
 * GET /images/:key -> 302 to MINIO_PUBLIC_URL/bucket/key
 * Allows mobile/app to use a single origin (API) for image src.
 */
@Controller('images')
export class ImagesController {
  constructor(private readonly uploadService: UploadService) {}

  @Get(':key')
  redirectToImage(@Param('key') key: string, @Res() res: Response) {
    if (!key || typeof key !== 'string') {
      return res.status(404).send('Not found');
    }
    const url = this.uploadService.getImageUrl(key);
    return res.redirect(302, url);
  }
}
