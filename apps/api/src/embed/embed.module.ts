import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmbedController } from './embed.controller';
import { Post } from '../entities/post.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post])],
  controllers: [EmbedController],
})
export class EmbedModule {}
