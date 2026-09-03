import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { MoveColumnDto } from './dto/move-column.dto';
import { Role } from '@prisma/client';

@Injectable()
export class ColumnsService {
  constructor(private prisma: PrismaService) {}

  async create(boardId: string, createColumnDto: CreateColumnDto, userId: string) {
    await this.checkBoardAccess(boardId, userId, [Role.OWNER, Role.EDITOR]);

    const lastColumn = await this.prisma.column.findFirst({
      where: { boardId },
      orderBy: { order: 'desc' },
    });

    const order = lastColumn ? lastColumn.order + 1000 : 1000;

    return this.prisma.column.create({
      data: {
        name: createColumnDto.name,
        boardId,
        order,
      },
    });
  }

  async update(id: string, updateColumnDto: UpdateColumnDto, userId: string) {
    const column = await this.prisma.column.findUnique({
      where: { id },
      include: { board: { include: { members: true } } },
    });

    if (!column) {
      throw new NotFoundException('Column not found');
    }

    await this.checkBoardAccess(column.boardId, userId, [Role.OWNER, Role.EDITOR]);

    return this.prisma.column.update({
      where: { id },
      data: updateColumnDto,
    });
  }

  async delete(id: string, userId: string) {
    const column = await this.prisma.column.findUnique({
      where: { id },
      include: { board: { include: { members: true } }, tasks: true },
    });

    if (!column) {
      throw new NotFoundException('Column not found');
    }

    await this.checkBoardAccess(column.boardId, userId, [Role.OWNER, Role.EDITOR]);

    if (column.tasks.length > 0) {
      throw new BadRequestException('Cannot delete column with tasks. Move or delete the tasks first.');
    }

    await this.prisma.column.delete({ where: { id } });
    return { message: 'Column deleted successfully' };
  }

  async move(id: string, moveColumnDto: MoveColumnDto, userId: string) {
    const column = await this.prisma.column.findUnique({
      where: { id },
      include: { board: { include: { members: true } }, tasks: true },
    });

    if (!column) {
      throw new NotFoundException('Column not found');
    }

    await this.checkBoardAccess(column.boardId, userId, [Role.OWNER, Role.EDITOR]);

    const { newOrder } = moveColumnDto;

    const updatedColumn = await this.prisma.column.update({
      where: { id },
      data: { order: newOrder },
      include: { tasks: true },
    });

    return updatedColumn;
  }

  private async checkBoardAccess(boardId: string, userId: string, allowedRoles: Role[]) {
    const membership = await this.prisma.boardMember.findUnique({
      where: { boardId_userId: { boardId, userId } },
    });

    if (!membership || !allowedRoles.includes(membership.role)) {
      throw new ForbiddenException('You do not have permission for this action');
    }
  }
}
