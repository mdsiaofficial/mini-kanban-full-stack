import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { Role } from '../../generated/prisma/client.js';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async create(columnId: number, createTaskDto: CreateTaskDto, userId: number) {
    const column = await this.prisma.column.findUnique({
      where: { id: columnId },
      include: { board: { include: { members: true } } },
    });

    if (!column) {
      throw new NotFoundException('Column not found');
    }

    await this.checkBoardAccess(column.boardId, userId, [Role.OWNER, Role.EDITOR]);

    const lastTask = await this.prisma.task.findFirst({
      where: { columnId, nextId: null },
      orderBy: { id: 'desc' },
    });

    const data: any = {
      title: createTaskDto.title,
      description: createTaskDto.description,
      columnId,
    };

    if (lastTask) {
      data.prevId = lastTask.id;
    }

    const newTask = await this.prisma.task.create({ data });

    if (lastTask) {
      await this.prisma.task.update({
        where: { id: lastTask.id },
        data: { nextId: newTask.id },
      });
    }

    return newTask;
  }

  async update(id: number, updateTaskDto: UpdateTaskDto, userId: number) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: { column: { include: { board: { include: { members: true } } } } },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.checkBoardAccess(task.column.boardId, userId, [Role.OWNER, Role.EDITOR]);

    return this.prisma.task.update({
      where: { id },
      data: updateTaskDto,
    });
  }

  async delete(id: number, userId: number) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: { column: { include: { board: { include: { members: true } } } } },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.checkBoardAccess(task.column.boardId, userId, [Role.OWNER, Role.EDITOR]);

    await this.prisma.$transaction(async (prisma) => {
      if (task.prevId !== null) {
        await prisma.task.update({
          where: { id: task.prevId },
          data: { nextId: task.nextId },
        });
      }
      if (task.nextId !== null) {
        await prisma.task.update({
          where: { id: task.nextId },
          data: { prevId: task.prevId },
        });
      }
      await prisma.task.delete({ where: { id } });
    });

    return { message: 'Task deleted successfully' };
  }

  async move(id: number, moveTaskDto: MoveTaskDto, userId: number) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: { column: { include: { board: { include: { members: true } } } } },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.checkBoardAccess(task.column.boardId, userId, [Role.OWNER, Role.EDITOR]);

    const { targetColumnId, targetTaskId, position } = moveTaskDto;

    if (targetColumnId !== task.columnId && targetTaskId === undefined) {
      throw new BadRequestException('targetTaskId is required when moving to a different column');
    }

    const targetColumn = await this.prisma.column.findUnique({
      where: { id: targetColumnId },
    });

    if (!targetColumn) {
      throw new NotFoundException('Target column not found');
    }

    if (targetColumn.boardId !== task.column.boardId) {
      throw new ForbiddenException('Cannot move task to a different board');
    }

    if (targetTaskId !== undefined) {
      const targetTask = await this.prisma.task.findUnique({ where: { id: targetTaskId } });
      if (!targetTask) {
        throw new NotFoundException('Target task not found');
      }
      if (targetTask.columnId !== targetColumnId) {
        throw new BadRequestException('Target task must be in the same column');
      }
    }

    await this.prisma.$transaction(async (prisma) => {
      const currentPrevId = task.prevId;
      const currentNextId = task.nextId;

      if (currentPrevId !== null) {
        await prisma.task.update({
          where: { id: currentPrevId },
          data: { nextId: currentNextId },
        });
      }
      if (currentNextId !== null) {
        await prisma.task.update({
          where: { id: currentNextId },
          data: { prevId: currentPrevId },
        });
      }

      if (targetTaskId === undefined) {
        const lastTask = await prisma.task.findFirst({
          where: { columnId: targetColumnId, nextId: null },
          orderBy: { id: 'desc' },
        });

        if (lastTask) {
          await prisma.task.update({
            where: { id: lastTask.id },
            data: { nextId: id },
          });
          await prisma.task.update({
            where: { id },
            data: { prevId: lastTask.id, nextId: null, columnId: targetColumnId },
          });
        } else {
          await prisma.task.update({
            where: { id },
            data: { prevId: null, nextId: null, columnId: targetColumnId },
          });
        }
      } else {
        const targetTask = await prisma.task.findUnique({ where: { id: targetTaskId } });
        if (!targetTask) {
          throw new NotFoundException('Target task not found');
        }

        if (position === 'before') {
          const targetPrevId = targetTask.prevId;

          if (targetPrevId !== null) {
            await prisma.task.update({
              where: { id: targetPrevId },
              data: { nextId: id },
            });
          }

          await prisma.task.update({
            where: { id },
            data: { prevId: targetPrevId, nextId: targetTaskId, columnId: targetColumnId },
          });

          await prisma.task.update({
            where: { id: targetTaskId },
            data: { prevId: id },
          });
        } else {
          const targetNextId = targetTask.nextId;

          if (targetNextId !== null) {
            await prisma.task.update({
              where: { id: targetNextId },
              data: { prevId: id },
            });
          }

          await prisma.task.update({
            where: { id },
            data: { prevId: targetTaskId, nextId: targetNextId, columnId: targetColumnId },
          });

          await prisma.task.update({
            where: { id: targetTaskId },
            data: { nextId: id },
          });
        }
      }
    });

    return this.prisma.task.findUnique({
      where: { id },
      include: { column: true },
    });
  }

  private async checkBoardAccess(boardId: number, userId: number, allowedRoles: Role[]) {
    const membership = await this.prisma.boardMember.findUnique({
      where: { boardId_userId: { boardId, userId } },
    });

    if (!membership || !allowedRoles.includes(membership.role)) {
      throw new ForbiddenException('You do not have permission for this action');
    }
  }
}
