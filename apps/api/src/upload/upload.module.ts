import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { ImagesController } from './images.controller';
import { UploadService } from './upload.service';
import { SafetyModule } from '../safety/safety.module';

@Module({
  imports: [SafetyModule],
  controllers: [UploadController, ImagesController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
