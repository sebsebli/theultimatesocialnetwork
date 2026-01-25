import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { PostVisibility } from '../../entities/post.entity';

export class CreatePostDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(5000) // Reasonable limit
  body: string;

  @IsOptional()
  @IsEnum(PostVisibility)
  visibility?: PostVisibility;

  @IsOptional()
  @IsString()
  headerImageKey?: string;
}
