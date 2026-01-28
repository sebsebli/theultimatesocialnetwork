import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class AddItemDto {
  @IsNotEmpty()
  @IsUUID()
  postId: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
