import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { Role } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async create(columnId: string, createTaskDto: CreateTaskDto, userId: string) {
    const column = await this.prisma.db.column.findUnique({
      where: { id: columnId },
      include: { board: { include: { members: true } } },
    });

    if (!column) {
      throw new NotFoundException('Column not found');
    }

    await this.checkBoardAccess(column.boardId, userId, [Role.OWNER, Role.EDITOR]);

    const lastTask = await this.prisma.db.task.findFirst({
      where: { columnId },
      orderBy: { order: 'desc' },
    });

    const order = lastTask ? lastTask.order + 1000 : 1000;

    return this.prisma.db.task.create({
      data: {
        title: createTaskDto.title,
        description: createTaskDto.description,
        columnId,
        order,
      },
    });
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, userId: string) {
    const task = await this.prisma.db.task.findUnique({
      where: { id },
      include: { column: { include: { board: { include: { members: true } } } } },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.checkBoardAccess(task.column.boardId, userId, [Role.OWNER, Role.EDITOR]);

    return this.prisma.db.task.update({
      where: { id },
      data: updateTaskDto,
    });
  }

  async delete(id: string, userId: string) {
    const task = await this.prisma.db.task.findUnique({
      where: { id },
      include: { column: { include: { board: { include: { members: true } } } } },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.checkBoardAccess(task.column.boardId, userId, [Role.OWNER, Role.EDITOR]);

    await this.prisma.db.task.delete({ where: { id } });
    return { message: 'Task deleted successfully' };
  }

  async move(id: string, moveTaskDto: MoveTaskDto, userId: string) {
    const task = await this.prisma.db.task.findUnique({
      where: { id },
      include: { column: { include: { board: { include: { members: true } } } } },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.checkBoardAccess(task.column.boardId, userId, [Role.OWNER, Role.EDITOR]);

    const { targetColumnId, newOrder } = moveTaskDto;

    const targetColumn = await this.prisma.db.column.findUnique({
      where: { id: targetColumnId },
    });

    if (!targetColumn) {
      throw new NotFoundException('Target column not found');
    }

    if (targetColumn.boardId !== task.column.boardId) {
      throw new ForbiddenException('Cannot move task to a different board');
    }

    const updatedTask = await this.prisma.db.task.update({
      where: { id },
      data: {
        columnId: targetColumnId,
        order: newOrder,
      },
      include: { column: true },
    });

    return updatedTask;
  }

  private async checkBoardAccess(boardId: string, userId: string, allowedRoles: Role[]) {
    const membership = await this.prisma.db.boardMember.findUnique({
      where: { boardId_userId: { boardId, userId } },
    });

    if (!membership || !allowedRoles.includes(membership.role)) {
      throw new ForbiddenException('You do not have permission for this action');
    }
  }
}
