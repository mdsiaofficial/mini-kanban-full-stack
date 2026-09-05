import { Controller, Post, Patch, Delete, Body, Param, UseGuards, Req, ParseIntPipe } from '@nestjs/common';
import type { Request } from 'express';
import { ColumnsService } from './columns.service';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { MoveColumnDto } from './dto/move-column.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class ColumnsController {
  constructor(private columnsService: ColumnsService) {}

  @Post('boards/:boardId/columns')
  async create(
    @Param('boardId', ParseIntPipe) boardId: number,
    @Body() createColumnDto: CreateColumnDto,
    @Req() req: Request,
  ) {
    return this.columnsService.create(boardId, createColumnDto, req.user.userId);
  }

  @Patch('columns/:id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateColumnDto: UpdateColumnDto, @Req() req: Request) {
    return this.columnsService.update(id, updateColumnDto, req.user.userId);
  }

  @Delete('columns/:id')
  async delete(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.columnsService.delete(id, req.user.userId);
  }

  @Patch('columns/:id/move')
  async move(@Param('id', ParseIntPipe) id: number, @Body() moveColumnDto: MoveColumnDto, @Req() req: Request) {
    return this.columnsService.move(id, moveColumnDto, req.user.userId);
  }
}
