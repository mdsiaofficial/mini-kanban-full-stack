import { IsString, MaxLength, IsOptional } from 'class-validator';

export class UpdateColumnDto {
  @IsString()
  @MaxLength(50)
  @IsOptional()
  name?: string;
}
