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

  /** Optional; API ignores and uses PUBLIC. Allowed so clients (e.g. agents) can send it without validation error. */
  @IsOptional()
  @IsString()
  visibility?: string;
}
