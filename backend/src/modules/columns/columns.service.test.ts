import { describe, test, expect, beforeEach, afterEach, vi } from 'bun:test';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ColumnsService } from './columns.service';

enum Role {
  OWNER = 'OWNER',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
}

const createMockPrismaService = () => ({
  column: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  boardMember: {
    findUnique: vi.fn(),
  },
});

vi.mock('../../prisma/prisma.service', () => ({
  PrismaService: vi.fn().mockImplementation(createMockPrismaService),
}));

describe('ColumnsService', () => {
  let columnsService: ColumnsService;
  let mockPrismaService: ReturnType<typeof createMockPrismaService>;

  const mockBoard = {
    id: 1,
    name: 'Test Board',
    description: 'A test board',
    ownerId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMember = {
    id: 1,
    boardId: 1,
    userId: 1,
    role: Role.EDITOR,
    user: { id: 1, email: 'editor@example.com', name: 'Editor' },
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

    columnsService = new ColumnsService(mockPrismaService as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('create', () => {
    test('should create a new column', async () => {
      const newColumn = { id: 4, name: 'Review', boardId: 1, order: 4000, tasks: [] };
      mockPrismaService.boardMember.findUnique.mockResolvedValue(mockMember);
      mockPrismaService.column.findFirst.mockResolvedValue({ ...mockColumn, order: 3000 });
      mockPrismaService.column.create.mockResolvedValue(newColumn);

      const result = await columnsService.create(1, { name: 'Review' }, 1);

      expect(result).toEqual(newColumn);
      expect(mockPrismaService.column.create).toHaveBeenCalledWith({
        data: {
          name: 'Review',
          boardId: 1,
          order: 4000,
        },
      });
    });

    test('should create column with order 1000 if no columns exist', async () => {
      const newColumn = { id: 1, name: 'First Column', boardId: 1, order: 1000, tasks: [] };
      mockPrismaService.boardMember.findUnique.mockResolvedValue(mockMember);
      mockPrismaService.column.findFirst.mockResolvedValue(null);
      mockPrismaService.column.create.mockResolvedValue(newColumn);

      await columnsService.create(1, { name: 'First Column' }, 1);

      expect(mockPrismaService.column.create).toHaveBeenCalledWith({
        data: {
          name: 'First Column',
          boardId: 1,
          order: 1000,
        },
      });
    });

    test('should throw ForbiddenException if user has no access', async () => {
      mockPrismaService.boardMember.findUnique.mockResolvedValue(null);

      await expect(
        columnsService.create(1, { name: 'New Column' }, 999),
      ).rejects.toThrow(ForbiddenException);
    });

    test('should throw ForbiddenException if user is viewer', async () => {
      mockPrismaService.boardMember.findUnique.mockResolvedValue({
        ...mockMember,
        role: Role.VIEWER,
      });

      await expect(
        columnsService.create(1, { name: 'New Column' }, 1),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('move (reordering)', () => {
    test('should reorder column to new position', async () => {
      const columnWithBoard = { ...mockColumn, board: mockBoard, tasks: [] };
      const reorderedColumn = { ...mockColumn, order: 2500 };

      mockPrismaService.column.findUnique.mockResolvedValue(columnWithBoard);
      mockPrismaService.boardMember.findUnique.mockResolvedValue(mockMember);
      mockPrismaService.column.update.mockResolvedValue(reorderedColumn);

      const result = await columnsService.move(1, { newOrder: 2500 }, 1);

      expect(result).toEqual(reorderedColumn);
      expect(mockPrismaService.column.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { order: 2500 },
        include: { tasks: true },
      });
    });

    test('should throw NotFoundException if column not found', async () => {
      mockPrismaService.column.findUnique.mockResolvedValue(null);

      await expect(
        columnsService.move(999, { newOrder: 2000 }, 1),
      ).rejects.toThrow(NotFoundException);
    });

    test('should throw ForbiddenException if user is not editor or owner', async () => {
      const columnWithBoard = { ...mockColumn, board: mockBoard, tasks: [] };
      mockPrismaService.column.findUnique.mockResolvedValue(columnWithBoard);
      mockPrismaService.boardMember.findUnique.mockResolvedValue({
        ...mockMember,
        role: Role.VIEWER,
      });

      await expect(
        columnsService.move(1, { newOrder: 2000 }, 1),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    test('should update column name', async () => {
      const columnWithBoard = { ...mockColumn, board: mockBoard, tasks: [] };
      const updatedColumn = { ...mockColumn, name: 'Updated Name' };

      mockPrismaService.column.findUnique.mockResolvedValue(columnWithBoard);
      mockPrismaService.boardMember.findUnique.mockResolvedValue(mockMember);
      mockPrismaService.column.update.mockResolvedValue(updatedColumn);

      const result = await columnsService.update(1, { name: 'Updated Name' }, 1);

      expect(result).toEqual(updatedColumn);
      expect(mockPrismaService.column.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'Updated Name' },
      });
    });

    test('should throw NotFoundException if column not found', async () => {
      mockPrismaService.column.findUnique.mockResolvedValue(null);

      await expect(
        columnsService.update(999, { name: 'New Name' }, 1),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    test('should delete column without tasks', async () => {
      const columnWithBoard = { ...mockColumn, board: mockBoard, tasks: [] };
      mockPrismaService.column.findUnique.mockResolvedValue(columnWithBoard);
      mockPrismaService.boardMember.findUnique.mockResolvedValue(mockMember);
      mockPrismaService.column.delete.mockResolvedValue(mockColumn);

      const result = await columnsService.delete(1, 1);

      expect(result).toEqual({ message: 'Column deleted successfully' });
      expect(mockPrismaService.column.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    test('should throw BadRequestException if column has tasks', async () => {
      const columnWithTasks = {
        ...mockColumn,
        board: mockBoard,
        tasks: [{ id: 1, title: 'Task 1' }],
      };
      mockPrismaService.column.findUnique.mockResolvedValue(columnWithTasks);
      mockPrismaService.boardMember.findUnique.mockResolvedValue(mockMember);

      await expect(columnsService.delete(1, 1)).rejects.toThrow(BadRequestException);
    });

    test('should throw NotFoundException if column not found', async () => {
      mockPrismaService.column.findUnique.mockResolvedValue(null);

      await expect(columnsService.delete(999, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('column reordering scenarios', () => {
    test('should handle reordering to beginning of columns', async () => {
      const columnWithBoard = { ...mockColumn, board: mockBoard, tasks: [], order: 500 };
      const reorderedColumn = { ...mockColumn, order: 500 };

      mockPrismaService.column.findUnique.mockResolvedValue(columnWithBoard);
      mockPrismaService.boardMember.findUnique.mockResolvedValue(mockMember);
      mockPrismaService.column.update.mockResolvedValue(reorderedColumn);

      const result = await columnsService.move(1, { newOrder: 500 }, 1);

      expect(mockPrismaService.column.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { order: 500 },
        include: { tasks: true },
      });
    });

    test('should handle reordering to end of columns', async () => {
      const columnWithBoard = { ...mockColumn, board: mockBoard, tasks: [], order: 5000 };
      const reorderedColumn = { ...mockColumn, order: 5000 };

      mockPrismaService.column.findUnique.mockResolvedValue(columnWithBoard);
      mockPrismaService.boardMember.findUnique.mockResolvedValue(mockMember);
      mockPrismaService.column.update.mockResolvedValue(reorderedColumn);

      const result = await columnsService.move(1, { newOrder: 5000 }, 1);

      expect(mockPrismaService.column.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { order: 5000 },
        include: { tasks: true },
      });
    });

    test('should handle reordering between two columns', async () => {
      const columnWithBoard = { ...mockColumn, board: mockBoard, tasks: [], order: 1500 };
      const reorderedColumn = { ...mockColumn, order: 1500 };

      mockPrismaService.column.findUnique.mockResolvedValue(columnWithBoard);
      mockPrismaService.boardMember.findUnique.mockResolvedValue(mockMember);
      mockPrismaService.column.update.mockResolvedValue(reorderedColumn);

      const result = await columnsService.move(1, { newOrder: 1500 }, 1);

      expect(mockPrismaService.column.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { order: 1500 },
        include: { tasks: true },
      });
    });
  });
});
