import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsObject,
} from 'class-validator';

export class CreatePostDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(10000)
  body: string;

  @IsOptional()
  @IsEnum(['PUBLISHED', 'DRAFT'])
  status?: 'PUBLISHED' | 'DRAFT';

  @IsOptional()
  @IsString()
  headerImageKey?: string;

  @IsOptional()
  @IsString()
  headerImageBlurhash?: string;

  @IsOptional()
  @IsObject()
  media?: {
    type: 'gif' | 'video';
    url?: string;
    key?: string;
    width?: number;
    height?: number;
  };
}
