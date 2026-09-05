export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface BoardMember {
  id: string;
  userId: string;
  boardId: string;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
  user: User;
}

export interface Column {
  id: string;
  name: string;
  boardId: string;
  order: number;
  tasks: Task[];
}

export interface Board {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  columns: Column[];
  members: BoardMember[];
  owner: User;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  columnId: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface MoveTaskPayload {
  targetColumnId: string;
  targetTaskId?: number;
  position?: 'before' | 'after';
}

export interface MoveColumnPayload {
  newOrder: number;
}
