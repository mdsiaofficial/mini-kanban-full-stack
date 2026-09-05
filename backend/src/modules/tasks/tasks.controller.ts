import { Controller, Post, Patch, Delete, Body, Param, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
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
    @Request() req,
  ) {
    return this.tasksService.create(columnId, createTaskDto, req.user.userId);
  }

  @Patch('tasks/:id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateTaskDto: UpdateTaskDto, @Request() req) {
    return this.tasksService.update(id, updateTaskDto, req.user.userId);
  }

  @Delete('tasks/:id')
  async delete(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.tasksService.delete(id, req.user.userId);
  }

  @Patch('tasks/:id/move')
  async move(@Param('id', ParseIntPipe) id: number, @Body() moveTaskDto: MoveTaskDto, @Request() req) {
    return this.tasksService.move(id, moveTaskDto, req.user.userId);
  }
}
