import { IsString, IsNumber } from 'class-validator';

export class MoveTaskDto {
  @IsString()
  targetColumnId: string;

  @IsNumber()
  newOrder: number;
}
