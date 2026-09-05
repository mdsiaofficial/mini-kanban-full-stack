'use client';

import { create } from 'zustand';
import { Board, Column, Task } from '@/types';
import { boardsApi, columnsApi, tasksApi } from '@/lib/api';

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
      set({ error: error.response?.data?.message || error.message, isLoading: false });
    }
  },
  
  fetchBoard: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await boardsApi.getOne(id);
      set({ currentBoard: data, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || error.message, isLoading: false });
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
    await get().fetchBoard(boardId);
    return data;
  },
  
  updateColumn: async (id: string, name: string) => {
    await columnsApi.update(id, name);
    if (get().currentBoard) {
      await get().fetchBoard(get().currentBoard!.id);
    }
  },
  
  deleteColumn: async (id: string) => {
    await columnsApi.delete(id);
    if (get().currentBoard) {
      await get().fetchBoard(get().currentBoard!.id);
    }
  },
  
  moveColumn: async (id: string, newOrder: number) => {
    await columnsApi.move(id, newOrder);
    if (get().currentBoard) {
      await get().fetchBoard(get().currentBoard!.id);
    }
  },
  
  createTask: async (columnId: string, title: string, description?: string) => {
    const { data } = await tasksApi.create(columnId, title, description);
    if (get().currentBoard) {
      await get().fetchBoard(get().currentBoard!.id);
    }
    return data;
  },
  
  updateTask: async (id: string, taskData: { title?: string; description?: string }) => {
    await tasksApi.update(id, taskData);
    if (get().currentBoard) {
      await get().fetchBoard(get().currentBoard!.id);
    }
  },
  
  deleteTask: async (id: string) => {
    await tasksApi.delete(id);
    if (get().currentBoard) {
      await get().fetchBoard(get().currentBoard!.id);
    }
  },
  
  moveTask: async (id: string, targetColumnId: string, targetTaskId?: number, position?: 'before' | 'after') => {
    await tasksApi.move(id, targetColumnId, targetTaskId, position);
    if (get().currentBoard) {
      await get().fetchBoard(get().currentBoard!.id);
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
}));
