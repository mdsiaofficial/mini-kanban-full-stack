import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateBoardDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}
