import { IsNumber } from 'class-validator';

export class MoveColumnDto {
  @IsNumber()
  newOrder!: number;
}
