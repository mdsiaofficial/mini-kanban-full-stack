import { IsNumber, IsOptional, IsIn } from 'class-validator';

export class MoveTaskDto {
  @IsNumber()
  targetColumnId: number;

  @IsOptional()
  @IsNumber()
  targetTaskId?: number;

  @IsOptional()
  @IsIn(['before', 'after'])
  position?: 'before' | 'after';
}
