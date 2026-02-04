import { Controller, Get, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { UploadService } from './upload.service';

/**
 * Serves images by streaming from storage (MinIO).
 * GET /images/:key or GET /images/* (multi-segment key like seed/avatar-handle.jpg)
 * -> stream image bytes so mobile/app can load via API (single origin, no redirect to MinIO).
 */
@Controller('images')
export class ImagesController {
  constructor(private readonly uploadService: UploadService) {}

  @Get('*')
  async streamImage(@Req() req: Request, @Res() res: Response) {
    const path = ((req.url ?? req.path ?? '').split('?')[0] ?? '').trim();
    // Path can be /api/images/key or /images/key (global prefix may be stripped by reverse proxy)
    const suffix = path.replace(/^.*\/images\/?/i, '');
    const rawKey = suffix ? decodeURIComponent(suffix) : '';
    const key = rawKey.replace(/^\/+/, '').trim();
    // Reject path traversal and invalid keys (defense in depth)
    if (!key || key.includes('..')) {
      return res.status(404).send('Not found');
    }
    try {
      const stream = await this.uploadService.getImageStream(key);
      const ext = key.split('.').pop()?.toLowerCase();
      const contentType =
        ext === 'jpg' || ext === 'jpeg'
          ? 'image/jpeg'
          : ext === 'png'
            ? 'image/png'
            : ext === 'gif'
              ? 'image/gif'
              : 'image/webp';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      stream.pipe(res);
    } catch {
      return res.status(404).send('Not found');
    }
  }
}
