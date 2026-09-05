'use client';

import { create } from 'zustand';
import { Board, Column, Task } from '@/types';
import { boardsApi, columnsApi, tasksApi } from '@/lib/api';
import { useSocketStore } from './socket';

interface BoardState {
  boards: Board[];
  currentBoard: Board | null;
  isLoading: boolean;
  error: string | null;
  
  fetchBoards: () => Promise<void>;
  fetchBoard: (id: string) => Promise<void>;
  createBoard: (name: string, description?: string) => Promise<Board>;
  updateBoard: (id: string, data: { name?: string; description?: string }) => Promise<void>;
  deleteBoard: (id: string) => Promise<void>;
  
  createColumn: (boardId: string, name: string) => Promise<Column>;
  updateColumn: (id: string, name: string) => Promise<void>;
  deleteColumn: (id: string) => Promise<void>;
  moveColumn: (id: string, newOrder: number) => Promise<void>;
  
  createTask: (columnId: string, title: string, description?: string) => Promise<Task>;
  updateTask: (id: string, data: { title?: string; description?: string }) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  moveTask: (id: string, targetColumnId: string, targetTaskId?: number, position?: 'before' | 'after') => Promise<void>;
  
  addBoardMember: (boardId: string, email: string, role?: string) => Promise<void>;
  removeBoardMember: (boardId: string, userId: string) => Promise<void>;
  
  subscribeToBoard: (boardId: string) => void;
  unsubscribeFromBoard: (boardId: string) => void;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  boards: [],
  currentBoard: null,
  isLoading: false,
  error: null,
  
  fetchBoards: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await boardsApi.getAll();
      set({ boards: data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  fetchBoard: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await boardsApi.getOne(id);
      set({ currentBoard: data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  createBoard: async (name: string, description?: string) => {
    const { data } = await boardsApi.create(name, description);
    set((state) => ({ boards: [data, ...state.boards] }));
    return data;
  },
  
  updateBoard: async (id: string, boardData: { name?: string; description?: string }) => {
    await boardsApi.update(id, boardData);
    set((state) => ({
      boards: state.boards.map((b) => (b.id === id ? { ...b, ...boardData } : b)),
      currentBoard: state.currentBoard?.id === id ? { ...state.currentBoard, ...boardData } : state.currentBoard,
    }));
  },
  
  deleteBoard: async (id: string) => {
    await boardsApi.delete(id);
    set((state) => ({
      boards: state.boards.filter((b) => b.id !== id),
      currentBoard: state.currentBoard?.id === id ? null : state.currentBoard,
    }));
  },
  
  createColumn: async (boardId: string, name: string) => {
    const { data } = await columnsApi.create(boardId, name);
    const socket = useSocketStore.getState().socket;
    socket?.emit('columnCreated', { boardId, column: data });
    return data;
  },
  
  updateColumn: async (id: string, name: string) => {
    const { data } = await columnsApi.update(id, name);
    const socket = useSocketStore.getState().socket;
    if (get().currentBoard) {
      socket?.emit('columnUpdated', { boardId: get().currentBoard!.id, column: data });
    }
  },
  
  deleteColumn: async (id: string) => {
    await columnsApi.delete(id);
    const socket = useSocketStore.getState().socket;
    if (get().currentBoard) {
      socket?.emit('columnDeleted', { boardId: get().currentBoard!.id, columnId: id });
    }
  },
  
  moveColumn: async (id: string, newOrder: number) => {
    const { data } = await columnsApi.move(id, newOrder);
    const socket = useSocketStore.getState().socket;
    if (get().currentBoard) {
      socket?.emit('columnUpdated', { boardId: get().currentBoard!.id, column: data });
    }
  },
  
  createTask: async (columnId: string, title: string, description?: string) => {
    const { data } = await tasksApi.create(columnId, title, description);
    const socket = useSocketStore.getState().socket;
    if (get().currentBoard) {
      socket?.emit('taskCreated', { boardId: get().currentBoard!.id, task: data, columnId });
    }
    return data;
  },
  
  updateTask: async (id: string, taskData: { title?: string; description?: string }) => {
    const { data } = await tasksApi.update(id, taskData);
    const socket = useSocketStore.getState().socket;
    if (get().currentBoard) {
      socket?.emit('taskUpdated', { boardId: get().currentBoard!.id, task: data });
    }
  },
  
  deleteTask: async (id: string) => {
    const task = get().currentBoard?.columns.flatMap((c) => c.tasks).find((t) => t.id === id);
    await tasksApi.delete(id);
    const socket = useSocketStore.getState().socket;
    if (get().currentBoard && task) {
      socket?.emit('taskDeleted', { boardId: get().currentBoard!.id, taskId: id, columnId: task.columnId });
    }
  },
  
  moveTask: async (id: string, targetColumnId: string, targetTaskId?: number, position?: 'before' | 'after') => {
    const { data } = await tasksApi.move(id, targetColumnId, targetTaskId, position);
    const socket = useSocketStore.getState().socket;
    if (get().currentBoard) {
      const task = get().currentBoard!.columns.flatMap((c) => c.tasks).find((t) => t.id === id);
      socket?.emit('taskMoved', {
        boardId: get().currentBoard!.id,
        taskId: id,
        fromColumnId: task?.columnId || targetColumnId,
        toColumnId: targetColumnId,
        targetTaskId,
        position,
      });
    }
  },
  
  addBoardMember: async (boardId: string, email: string, role?: string) => {
    await boardsApi.addMember(boardId, email, role);
    await get().fetchBoard(boardId);
  },
  
  removeBoardMember: async (boardId: string, userId: string) => {
    await boardsApi.removeMember(boardId, userId);
    await get().fetchBoard(boardId);
  },
  
  subscribeToBoard: (boardId: string) => {
    const socket = useSocketStore.getState().socket;
    socket?.emit('joinBoard', { boardId });
  },
  
  unsubscribeFromBoard: (boardId: string) => {
    const socket = useSocketStore.getState().socket;
    socket?.emit('leaveBoard', { boardId });
  },
}));
