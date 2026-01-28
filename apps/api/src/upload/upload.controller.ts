import {
  Controller,
  Post,
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

  @Post('header-image')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('image'))
  async uploadHeaderImage(
    @CurrentUser() user: { id: string },
    @UploadedFile() file: any,
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    const { key, blurhash } = await this.uploadService.uploadHeaderImage(file);
    const url = this.uploadService.getImageUrl(key);

    return { key, url, blurhash };
  }

  @Post('profile-picture')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('image'))
  async uploadProfilePicture(
    @CurrentUser() user: { id: string },
    @UploadedFile() file: any,
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    const key = await this.uploadService.uploadProfilePicture(file);
    const url = this.uploadService.getImageUrl(key);

    return { key, url };
  }
}
