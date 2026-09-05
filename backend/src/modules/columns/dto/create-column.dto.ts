import { IsString, MaxLength } from 'class-validator';

export class CreateColumnDto {
  @IsString()
  @MaxLength(50)
  name: string;
}
