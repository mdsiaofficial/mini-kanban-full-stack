import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { Role } from '@prisma/client';

@Injectable()
export class BoardsService {
  constructor(private prisma: PrismaService) {}

  async create(createBoardDto: CreateBoardDto, userId: string) {
    const board = await this.prisma.db.board.create({
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

  async findAll(userId: string) {
    return this.prisma.db.board.findMany({
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

  async findOne(id: string, userId: string) {
    const board = await this.prisma.db.board.findUnique({
      where: { id },
      include: {
        columns: {
          include: { tasks: { orderBy: { order: 'asc' } } },
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

    return board;
  }

  async update(id: string, updateBoardDto: UpdateBoardDto, userId: string) {
    const board = await this.findBoardWithMembership(id, userId);
    const membership = board.members.find(m => m.userId === userId);

    if (!membership || (membership.role !== Role.OWNER && membership.role !== Role.EDITOR)) {
      throw new ForbiddenException('You do not have permission to update this board');
    }

    return this.prisma.db.board.update({
      where: { id },
      data: updateBoardDto,
    });
  }

  async delete(id: string, userId: string) {
    const board = await this.findBoardWithMembership(id, userId);
    const membership = board.members.find(m => m.userId === userId);

    if (!membership || membership.role !== Role.OWNER) {
      throw new ForbiddenException('Only the owner can delete this board');
    }

    await this.prisma.db.board.delete({ where: { id } });
    return { message: 'Board deleted successfully' };
  }

  async addMember(boardId: string, addMemberDto: AddMemberDto, userId: string) {
    const board = await this.findBoardWithMembership(boardId, userId);
    const membership = board.members.find(m => m.userId === userId);

    if (!membership || membership.role !== Role.OWNER) {
      throw new ForbiddenException('Only the owner can add members');
    }

    const userToAdd = await this.prisma.db.user.findUnique({
      where: { email: addMemberDto.email },
    });

    if (!userToAdd) {
      throw new NotFoundException('User not found');
    }

    const existingMembership = board.members.find(m => m.userId === userToAdd.id);
    if (existingMembership) {
      throw new ForbiddenException('User is already a member');
    }

    return this.prisma.db.boardMember.create({
      data: {
        boardId,
        userId: userToAdd.id,
        role: addMemberDto.role || Role.VIEWER,
      },
      include: { user: { select: { id: true, email: true, name: true } } },
    });
  }

  async removeMember(boardId: string, memberId: string, userId: string) {
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

    await this.prisma.db.boardMember.delete({
      where: { id: memberToRemove.id },
    });

    return { message: 'Member removed successfully' };
  }

  async getMembers(boardId: string, userId: string) {
    await this.findOne(boardId, userId);

    return this.prisma.db.boardMember.findMany({
      where: { boardId },
      include: { user: { select: { id: true, email: true, name: true } } },
    });
  }

  async getUserRole(boardId: string, userId: string): Promise<Role> {
    const membership = await this.prisma.db.boardMember.findUnique({
      where: { boardId_userId: { boardId, userId } },
    });
    return membership?.role;
  }

  private async findBoardWithMembership(boardId: string, userId: string) {
    const board = await this.prisma.db.board.findUnique({
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
