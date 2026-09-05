import { describe, test, expect, beforeEach, afterEach, vi } from 'bun:test';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { BoardsService } from './boards.service';

enum Role {
  OWNER = 'OWNER',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
}

const createMockPrismaService = () => ({
  board: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  boardMember: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    delete: vi.fn(),
  },
  column: {
    findUnique: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
});

vi.mock('../../prisma/prisma.service', () => ({
  PrismaService: vi.fn().mockImplementation(createMockPrismaService),
}));

describe('BoardsService', () => {
  let boardsService: BoardsService;
  let mockPrismaService: ReturnType<typeof createMockPrismaService>;

  const mockBoard = {
    id: 1,
    name: 'Test Board',
    description: 'A test board',
    ownerId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockBoardMember = {
    id: 1,
    boardId: 1,
    userId: 1,
    role: Role.OWNER,
    createdAt: new Date(),
    user: { id: 1, email: 'owner@example.com', name: 'Owner' },
  };

  const mockColumn = {
    id: 1,
    name: 'To Do',
    boardId: 1,
    order: 1000,
    tasks: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrismaService = createMockPrismaService();

    boardsService = new BoardsService(mockPrismaService as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('create', () => {
    test('should create a new board with default columns', async () => {
      const mockCreatedBoard = {
        ...mockBoard,
        columns: [mockColumn],
        members: [mockBoardMember],
      };

      mockPrismaService.board.create.mockResolvedValue(mockCreatedBoard);

      const result = await boardsService.create(
        { name: 'Test Board', description: 'A test board' },
        1,
      );

      expect(result).toEqual(mockCreatedBoard);
      expect(mockPrismaService.board.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Board',
          description: 'A test board',
          ownerId: 1,
          members: {
            create: {
              userId: 1,
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
    });
  });

  describe('findAll', () => {
    test('should return all boards for a user', async () => {
      const mockBoards = [mockBoard];
      mockPrismaService.board.findMany.mockResolvedValue(mockBoards);

      const result = await boardsService.findAll(1);

      expect(result).toEqual(mockBoards);
      expect(mockPrismaService.board.findMany).toHaveBeenCalledWith({
        where: {
          OR: [{ ownerId: 1 }, { members: { some: { userId: 1 } } }],
        },
        include: {
          columns: { include: { tasks: true }, orderBy: { order: 'asc' } },
          owner: { select: { id: true, email: true, name: true } },
        },
        orderBy: { updatedAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    test('should return a board by id', async () => {
      const mockBoardWithDetails = {
        ...mockBoard,
        columns: [mockColumn],
        members: [mockBoardMember],
        owner: { id: 1, email: 'owner@example.com', name: 'Owner' },
      };
      mockPrismaService.board.findUnique.mockResolvedValue(mockBoardWithDetails);

      const result = await boardsService.findOne(1, 1);

      expect(result).toEqual(mockBoardWithDetails);
    });

    test('should throw NotFoundException if board not found', async () => {
      mockPrismaService.board.findUnique.mockResolvedValue(null);

      await expect(boardsService.findOne(999, 1)).rejects.toThrow(NotFoundException);
    });

    test('should throw ForbiddenException if user is not a member', async () => {
      const mockBoardWithMembers = {
        ...mockBoard,
        columns: [mockColumn],
        members: [{ ...mockBoardMember, userId: 2 }],
      };
      mockPrismaService.board.findUnique.mockResolvedValue(mockBoardWithMembers);

      await expect(boardsService.findOne(1, 1)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('addMember', () => {
    test('should add a member to the board', async () => {
      const mockBoardWithMembers = {
        ...mockBoard,
        members: [mockBoardMember],
      };
      const mockNewUser = { id: 2, email: 'new@example.com', name: 'New User' };
      const mockNewMember = {
        id: 2,
        boardId: 1,
        userId: 2,
        role: Role.VIEWER,
        user: mockNewUser,
      };

      mockPrismaService.board.findUnique.mockResolvedValue(mockBoardWithMembers);
      mockPrismaService.user.findUnique.mockResolvedValue(mockNewUser);
      mockPrismaService.boardMember.create.mockResolvedValue(mockNewMember);

      const result = await boardsService.addMember(
        1,
        { email: 'new@example.com', role: Role.VIEWER },
        1,
      );

      expect(result).toEqual(mockNewMember);
      expect(mockPrismaService.boardMember.create).toHaveBeenCalledWith({
        data: {
          boardId: 1,
          userId: 2,
          role: Role.VIEWER,
        },
        include: { user: { select: { id: true, email: true, name: true } } },
      });
    });

    test('should throw ForbiddenException if non-owner tries to add member', async () => {
      const mockBoardWithEditor = {
        ...mockBoard,
        members: [{ ...mockBoardMember, userId: 1, role: Role.EDITOR }],
      };
      mockPrismaService.board.findUnique.mockResolvedValue(mockBoardWithEditor);

      await expect(
        boardsService.addMember(1, { email: 'new@example.com' }, 1),
      ).rejects.toThrow(ForbiddenException);
    });

    test('should throw NotFoundException if user to add not found', async () => {
      const mockBoardWithMembers = {
        ...mockBoard,
        members: [mockBoardMember],
      };
      mockPrismaService.board.findUnique.mockResolvedValue(mockBoardWithMembers);
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        boardsService.addMember(1, { email: 'nonexistent@example.com' }, 1),
      ).rejects.toThrow(NotFoundException);
    });

    test('should throw ForbiddenException if user is already a member', async () => {
      const mockBoardWithMembers = {
        ...mockBoard,
        members: [
          mockBoardMember,
          { id: 2, boardId: 1, userId: 2, role: Role.VIEWER, user: { id: 2, email: 'member@example.com', name: 'Member' } },
        ],
      };
      mockPrismaService.board.findUnique.mockResolvedValue(mockBoardWithMembers);
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 2, email: 'member@example.com', name: 'Member' });

      await expect(
        boardsService.addMember(1, { email: 'member@example.com' }, 1),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('delete', () => {
    test('should delete a board', async () => {
      const mockBoardWithMembers = {
        ...mockBoard,
        members: [mockBoardMember],
      };
      mockPrismaService.board.findUnique.mockResolvedValue(mockBoardWithMembers);
      mockPrismaService.board.delete.mockResolvedValue(mockBoard);

      const result = await boardsService.delete(1, 1);

      expect(result).toEqual({ message: 'Board deleted successfully' });
      expect(mockPrismaService.board.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    test('should throw ForbiddenException if non-owner tries to delete', async () => {
      const mockBoardWithEditor = {
        ...mockBoard,
        members: [{ ...mockBoardMember, userId: 1, role: Role.EDITOR }],
      };
      mockPrismaService.board.findUnique.mockResolvedValue(mockBoardWithEditor);

      await expect(boardsService.delete(1, 1)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getUserRole', () => {
    test('should return user role for a board', async () => {
      mockPrismaService.boardMember.findUnique.mockResolvedValue({
        boardId: 1,
        userId: 1,
        role: Role.EDITOR,
      });

      const result = await boardsService.getUserRole(1, 1);

      expect(result).toBe(Role.EDITOR);
    });

    test('should return undefined if user is not a member', async () => {
      mockPrismaService.boardMember.findUnique.mockResolvedValue(null);

      const result = await boardsService.getUserRole(1, 999);

      expect(result).toBeUndefined();
    });
  });
});
