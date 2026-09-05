import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { Role } from '../../generated/prisma/client.js';

@Injectable()
export class BoardsService {
  constructor(private prisma: PrismaService) {}

  async create(createBoardDto: CreateBoardDto, userId: number) {
    const board = await this.prisma.board.create({
      data: {
        name: createBoardDto.name,
        description: createBoardDto.description,
        ownerId: userId,
        members: {
          create: {
            userId: userId,
            role: Role.OWNER,
          },
        },
        columns: {
          create: [
            { name: 'To Do', order: 1000 },
            { name: 'In Progress', order: 2000 },
            { name: 'Done', order: 3000 },
          ],
        },
      },
      include: {
        columns: { include: { tasks: true }, orderBy: { order: 'asc' } },
        members: { include: { user: { select: { id: true, email: true, name: true } } } },
      },
    });
    return board;
  }

  async findAll(userId: number) {
    return this.prisma.board.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      include: {
        columns: { include: { tasks: true }, orderBy: { order: 'asc' } },
        owner: { select: { id: true, email: true, name: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: number, userId: number) {
    const board = await this.prisma.board.findUnique({
      where: { id },
      include: {
        columns: {
          include: { tasks: true },
          orderBy: { order: 'asc' },
        },
        members: { include: { user: { select: { id: true, email: true, name: true } } } },
        owner: { select: { id: true, email: true, name: true } },
      },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    const isMember = board.members.some(m => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenException('You do not have access to this board');
    }

    for (const column of board.columns) {
      column.tasks = this.resolveTaskOrder(column.tasks);
    }

    return board;
  }

  private resolveTaskOrder(tasks: any[]): any[] {
    if (tasks.length === 0) return tasks;

    const byId = new Map(tasks.map((t) => [t.id, t]));
    const byPrev = new Map(tasks.filter((t) => t.prevId !== null).map((t) => [t.prevId, t]));

    let head: any = null;
    for (const t of tasks) {
      if (t.prevId === null || !byId.has(t.prevId)) {
        head = t;
        break;
      }
    }

    if (!head) {
      head = tasks[0];
    }

    const ordered: any[] = [];
    let current: any = head;
    const visited = new Set<number>();

    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      ordered.push(current);
      current = current.nextId !== null ? byId.get(current.nextId) : undefined;
    }

    if (ordered.length < tasks.length) {
      for (const t of tasks) {
        if (!visited.has(t.id)) {
          ordered.push(t);
        }
      }
    }

    return ordered;
  }

  async update(id: number, updateBoardDto: UpdateBoardDto, userId: number) {
    const board = await this.findBoardWithMembership(id, userId);
    const membership = board.members.find(m => m.userId === userId);

    if (!membership || (membership.role !== Role.OWNER && membership.role !== Role.EDITOR)) {
      throw new ForbiddenException('You do not have permission to update this board');
    }

    return this.prisma.board.update({
      where: { id },
      data: updateBoardDto,
    });
  }

  async delete(id: number, userId: number) {
    const board = await this.findBoardWithMembership(id, userId);
    const membership = board.members.find(m => m.userId === userId);

    if (!membership || membership.role !== Role.OWNER) {
      throw new ForbiddenException('Only the owner can delete this board');
    }

    await this.prisma.board.delete({ where: { id } });
    return { message: 'Board deleted successfully' };
  }

  async addMember(boardId: number, addMemberDto: AddMemberDto, userId: number) {
    const board = await this.findBoardWithMembership(boardId, userId);
    const membership = board.members.find(m => m.userId === userId);

    if (!membership || membership.role !== Role.OWNER) {
      throw new ForbiddenException('Only the owner can add members');
    }

    const userToAdd = await this.prisma.user.findUnique({
      where: { email: addMemberDto.email },
    });

    if (!userToAdd) {
      throw new NotFoundException('User not found');
    }

    const existingMembership = board.members.find(m => m.userId === userToAdd.id);
    if (existingMembership) {
      throw new ForbiddenException('User is already a member');
    }

    return this.prisma.boardMember.create({
      data: {
        boardId,
        userId: userToAdd.id,
        role: addMemberDto.role || Role.VIEWER,
      },
      include: { user: { select: { id: true, email: true, name: true } } },
    });
  }

  async removeMember(boardId: number, memberId: number, userId: number) {
    const board = await this.findBoardWithMembership(boardId, userId);
    const membership = board.members.find(m => m.userId === userId);

    if (!membership || membership.role !== Role.OWNER) {
      throw new ForbiddenException('Only the owner can remove members');
    }

    const memberToRemove = board.members.find(m => m.userId === memberId);
    if (!memberToRemove) {
      throw new NotFoundException('Member not found');
    }

    if (memberToRemove.role === Role.OWNER) {
      throw new ForbiddenException('Cannot remove the owner');
    }

    await this.prisma.boardMember.delete({
      where: { id: memberToRemove.id },
    });

    return { message: 'Member removed successfully' };
  }

  async getMembers(boardId: number, userId: number) {
    await this.findOne(boardId, userId);

    return this.prisma.boardMember.findMany({
      where: { boardId },
      include: { user: { select: { id: true, email: true, name: true } } },
    });
  }

  async getUserRole(boardId: number, userId: number): Promise<Role | undefined> {
    const membership = await this.prisma.boardMember.findUnique({
      where: { boardId_userId: { boardId, userId } },
    });
    return membership?.role;
  }

  private async findBoardWithMembership(boardId: number, userId: number) {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: { members: true },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    const isMember = board.members.some(m => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenException('You do not have access to this board');
    }

    return board;
  }
}
