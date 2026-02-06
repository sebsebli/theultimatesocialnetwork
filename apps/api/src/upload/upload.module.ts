import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UploadController } from './upload.controller';
import { ImagesController } from './images.controller';
import { UploadService } from './upload.service';
import { ImageModerationWorker } from './image-moderation.worker';
import { SafetyModule } from '../safety/safety.module';
import { User } from '../entities/user.entity';
import { Post } from '../entities/post.entity';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [
    ConfigModule,
    SafetyModule,
    TypeOrmModule.forFeature([User, Post]),
    SharedModule,
  ],
  controllers: [UploadController, ImagesController],
  providers: [UploadService, ImageModerationWorker],
  exports: [UploadService],
})
export class UploadModule {}
