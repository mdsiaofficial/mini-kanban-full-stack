import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateTaskDto {
  @IsString()
  @MaxLength(200)
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
