import { Controller, Post, Patch, Delete, Body, Param, UseGuards, Req, ParseIntPipe } from '@nestjs/common';
import type { Request } from 'express';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Post('columns/:columnId/tasks')
  async create(
    @Param('columnId', ParseIntPipe) columnId: number,
    @Body() createTaskDto: CreateTaskDto,
    @Req() req: Request,
  ) {
    return this.tasksService.create(columnId, createTaskDto, req.user.userId);
  }

  @Patch('tasks/:id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateTaskDto: UpdateTaskDto, @Req() req: Request) {
    return this.tasksService.update(id, updateTaskDto, req.user.userId);
  }

  @Delete('tasks/:id')
  async delete(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.tasksService.delete(id, req.user.userId);
  }

  @Patch('tasks/:id/move')
  async move(@Param('id', ParseIntPipe) id: number, @Body() moveTaskDto: MoveTaskDto, @Req() req: Request) {
    return this.tasksService.move(id, moveTaskDto, req.user.userId);
  }
}
