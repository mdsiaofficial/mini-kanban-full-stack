import { IsNumber, IsOptional, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class MoveTaskDto {
  @Type(() => Number)
  @IsNumber()
  targetColumnId!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  targetTaskId?: number;

  @IsOptional()
  @IsIn(['before', 'after'])
  position?: 'before' | 'after';
}
