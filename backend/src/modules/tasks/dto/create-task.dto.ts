import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @MaxLength(200)
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;
}
