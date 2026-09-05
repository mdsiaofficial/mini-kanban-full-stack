import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateBoardDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
