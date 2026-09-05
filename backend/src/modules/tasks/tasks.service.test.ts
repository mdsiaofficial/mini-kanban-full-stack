import { describe, test, expect, beforeEach, afterEach, vi } from 'bun:test';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

enum Role {
  OWNER = 'OWNER',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
}

const createMockPrismaService = () => ({
  column: {
    findUnique: vi.fn(),
  },
  task: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  boardMember: {
    findUnique: vi.fn(),
  },
  $transaction: vi.fn(),
});

vi.mock('../../prisma/prisma.service', () => ({
  PrismaService: vi.fn().mockImplementation(createMockPrismaService),
}));


import { TasksService } from './tasks.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('TasksService', () => {
  let tasksService: TasksService;
  let mockPrismaService: ReturnType<typeof createMockPrismaService>;

  const mockBoard = {
    id: 1,
    name: 'Test Board',
    description: 'A test board',
    ownerId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockColumn = {
    id: 1,
    name: 'To Do',
    boardId: 1,
    order: 1000,
    board: mockBoard,
    tasks: [],
  };

  const mockTargetColumn = {
    id: 2,
    name: 'In Progress',
    boardId: 1,
    order: 2000,
    board: mockBoard,
    tasks: [],
  };

  const mockTask = {
    id: 1,
    title: 'Test Task',
    description: 'A test task',
    columnId: 1,
    prevId: null,
    nextId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    column: mockColumn,
  };

  const mockMember = {
    id: 1,
    boardId: 1,
    userId: 1,
    role: Role.EDITOR,
    user: { id: 1, email: 'editor@example.com', name: 'Editor' },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrismaService = createMockPrismaService();
    mockPrismaService.$transaction.mockImplementation(async (callback) => {
      return callback(mockPrismaService);
    });

    (PrismaService as any).mockImplementation(() => mockPrismaService);
    tasksService = new TasksService(mockPrismaService as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('create', () => {
    test('should create a new task with linked-list prevId', async () => {
      mockPrismaService.column.findUnique.mockResolvedValue(mockColumn);
      mockPrismaService.boardMember.findUnique.mockResolvedValue(mockMember);
      mockPrismaService.task.findFirst.mockResolvedValue(null);
      mockPrismaService.task.create.mockResolvedValue(mockTask);

      const result = await tasksService.create(
        1,
        { title: 'Test Task', description: 'A test task' },
        1,
      );

      expect(result).toEqual(mockTask);
      expect(mockPrismaService.task.create).toHaveBeenCalledWith({
        data: {
          title: 'Test Task',
          description: 'A test task',
          columnId: 1,
          prevId: undefined,
        },
      });
    });

    test('should create task with prevId set when column has existing tasks', async () => {
      const existingTask = { ...mockTask, id: 2, prevId: null, nextId: null };
      const newTask = { ...mockTask, id: 3, prevId: 2 };
      mockPrismaService.column.findUnique.mockResolvedValue(mockColumn);
      mockPrismaService.boardMember.findUnique.mockResolvedValue(mockMember);
      mockPrismaService.task.findFirst.mockResolvedValue(existingTask);
      mockPrismaService.task.create.mockResolvedValue(newTask);

      await tasksService.create(
        1,
        { title: 'New Task' },
        1,
      );

      expect(mockPrismaService.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ prevId: 2 }),
      });
    });

    test('should throw NotFoundException if column not found', async () => {
      mockPrismaService.column.findUnique.mockResolvedValue(null);

      await expect(
        tasksService.create(999, { title: 'Test Task' }, 1),
      ).rejects.toThrow(NotFoundException);
    });

    test('should throw ForbiddenException if user has no access', async () => {
      mockPrismaService.column.findUnique.mockResolvedValue(mockColumn);
      mockPrismaService.boardMember.findUnique.mockResolvedValue(null);

      await expect(
        tasksService.create(1, { title: 'Test Task' }, 999),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('move', () => {
    test('should move task to another column with targetTaskId', async () => {
      const movedTask = {
        ...mockTask,
        columnId: 2,
        prevId: null,
        nextId: null,
        column: mockTargetColumn,
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.boardMember.findUnique.mockResolvedValue(mockMember);
      mockPrismaService.column.findUnique.mockResolvedValue(mockTargetColumn);
      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.task.update.mockResolvedValue({});
      mockPrismaService.task.findUnique.mockResolvedValue(movedTask);

      const result = await tasksService.move(
        1,
        { targetColumnId: 2, targetTaskId: 5, position: 'before' },
        1,
      );

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    test('should move task within same column', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.boardMember.findUnique.mockResolvedValue(mockMember);
      mockPrismaService.column.findUnique.mockResolvedValue(mockColumn);
      mockPrismaService.task.findFirst.mockResolvedValue(null);
      mockPrismaService.task.update.mockResolvedValue({});
      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);

      const result = await tasksService.move(
        1,
        { targetColumnId: 1 },
        1,
      );

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    test('should throw BadRequestException when moving to different column without targetTaskId', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.boardMember.findUnique.mockResolvedValue(mockMember);

      await expect(
        tasksService.move(1, { targetColumnId: 2 }, 1),
      ).rejects.toThrow(BadRequestException);
    });

    test('should throw NotFoundException if task not found', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(null);

      await expect(
        tasksService.move(999, { targetColumnId: 2, targetTaskId: 1 }, 1),
      ).rejects.toThrow(NotFoundException);
    });

    test('should throw NotFoundException if target column not found', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.boardMember.findUnique.mockResolvedValue(mockMember);
      mockPrismaService.column.findUnique.mockResolvedValue(null);

      await expect(
        tasksService.move(1, { targetColumnId: 999, targetTaskId: 1 }, 1),
      ).rejects.toThrow(NotFoundException);
    });

    test('should throw ForbiddenException when moving to different board', async () => {
      const otherBoardColumn = { ...mockColumn, boardId: 2 };
      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.boardMember.findUnique.mockResolvedValue(mockMember);
      mockPrismaService.column.findUnique.mockResolvedValue(otherBoardColumn);

      await expect(
        tasksService.move(1, { targetColumnId: 2, targetTaskId: 1 }, 1),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('delete', () => {
    test('should delete a task and update linked list', async () => {
      const taskWithLinks = { ...mockTask, prevId: 10, nextId: 20 };
      mockPrismaService.task.findUnique.mockResolvedValue(taskWithLinks);
      mockPrismaService.boardMember.findUnique.mockResolvedValue(mockMember);
      mockPrismaService.task.update.mockResolvedValue({});
      mockPrismaService.task.delete.mockResolvedValue(mockTask);

      const result = await tasksService.delete(1, 1);

      expect(result).toEqual({ message: 'Task deleted successfully' });
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    test('should throw NotFoundException if task not found', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(null);

      await expect(tasksService.delete(999, 1)).rejects.toThrow(NotFoundException);
    });

    test('should throw ForbiddenException if user has no permission', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.boardMember.findUnique.mockResolvedValue(null);

      await expect(tasksService.delete(1, 999)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    test('should update a task', async () => {
      const updatedTask = { ...mockTask, title: 'Updated Title' };
      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.boardMember.findUnique.mockResolvedValue(mockMember);
      mockPrismaService.task.update.mockResolvedValue(updatedTask);

      const result = await tasksService.update(1, { title: 'Updated Title' }, 1);

      expect(result).toEqual(updatedTask);
      expect(mockPrismaService.task.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { title: 'Updated Title' },
      });
    });
  });

  describe('linked-list behavior', () => {
    test('should properly relink adjacent tasks when deleting middle task', async () => {
      const middleTask = { ...mockTask, id: 2, prevId: 1, nextId: 3 };
      mockPrismaService.task.findUnique.mockResolvedValue(middleTask);
      mockPrismaService.boardMember.findUnique.mockResolvedValue(mockMember);
      mockPrismaService.task.update.mockResolvedValue({});
      mockPrismaService.task.delete.mockResolvedValue(middleTask);

      await tasksService.delete(2, 1);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });
  });
});
