import { Module } from '@nestjs/common';
import { ColumnsService } from './columns.service';
import { ColumnsController } from './columns.controller';

@Module({
  providers: [ColumnsService],
  controllers: [ColumnsController],
  exports: [ColumnsService],
})
export class ColumnsModule {}
