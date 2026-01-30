import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PostVisibility } from '../../entities/post.entity';

export class CreatePostDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(10000) // Matches mobile composer BODY_MAX_LENGTH
  body: string;

  @IsOptional()
  @IsEnum(PostVisibility)
  visibility?: PostVisibility;

  @IsOptional()
  @IsString()
  headerImageKey?: string;

  @IsOptional()
  @IsString()
  headerImageBlurhash?: string;
}
