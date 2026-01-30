/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { UploadService } from './upload.service';
import { CurrentUser } from '../shared/current-user.decorator';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /** Resolve storage key to public URL (e.g. for author avatars in lists). */
  @Get('url')
  getImageUrl(@Query('key') key: string) {
    if (!key || typeof key !== 'string') return { url: null };
    return { url: this.uploadService.getImageUrl(key) };
  }

  @Post('header-image')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('image'))
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  async uploadHeaderImage(
    @CurrentUser() user: { id: string },
    @UploadedFile() file: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const { key, blurhash } = await this.uploadService.uploadHeaderImage(file);
    const url = this.uploadService.getImageUrl(key);

    return { key, url, blurhash };
  }

  @Post('profile-picture')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('image'))
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  async uploadProfilePicture(
    @CurrentUser() user: { id: string },
    @UploadedFile() file: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const key = await this.uploadService.uploadProfilePicture(file);
    const url = this.uploadService.getImageUrl(key);

    return { key, url };
  }

  @Post('profile-header')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('image'))
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  async uploadProfileHeader(
    @CurrentUser() user: { id: string },
    @UploadedFile() file: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const key = await this.uploadService.uploadProfileHeader(file);
    const url = this.uploadService.getImageUrl(key);

    return { key, url };
  }
}
