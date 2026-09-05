import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        
        return api(originalRequest);
      } catch {
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (email: string, password: string, name?: string) =>
    api.post('/auth/register', { email, password, name }),
  
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  logout: () => api.post('/auth/logout'),
  
  refresh: () =>
    api.post('/auth/refresh'),
};

export const usersApi = {
  getAll: () => api.get('/users'),
  
  getMe: () => api.get('/users/me'),
};

export const boardsApi = {
  getAll: () => api.get('/boards'),
  
  getOne: (id: string) => api.get(`/boards/${id}`),
  
  create: (name: string, description?: string) =>
    api.post('/boards', { name, description }),
  
  update: (id: string, data: { name?: string; description?: string }) =>
    api.patch(`/boards/${id}`, data),
  
  delete: (id: string) => api.delete(`/boards/${id}`),
  
  addMember: (boardId: string, email: string, role?: string) =>
    api.post(`/boards/${boardId}/members`, { email, role }),
  
  removeMember: (boardId: string, userId: string) =>
    api.delete(`/boards/${boardId}/members/${userId}`),
  
  getMembers: (boardId: string) => api.get(`/boards/${boardId}/members`),
};

export const columnsApi = {
  create: (boardId: string, name: string) =>
    api.post(`/boards/${boardId}/columns`, { name }),
  
  update: (id: string, name: string) =>
    api.patch(`/columns/${id}`, { name }),
  
  delete: (id: string) => api.delete(`/columns/${id}`),
  
  move: (id: string, newOrder: number) =>
    api.patch(`/columns/${id}/move`, { newOrder }),
};

export const tasksApi = {
  create: (columnId: string, title: string, description?: string) =>
    api.post(`/columns/${columnId}/tasks`, { title, description }),
  
  update: (id: string, data: { title?: string; description?: string }) =>
    api.patch(`/tasks/${id}`, data),
  
  delete: (id: string) => api.delete(`/tasks/${id}`),
  
  move: (id: string, targetColumnId: string | number, targetTaskId?: number, position?: 'before' | 'after') =>
    api.patch(`/tasks/${id}/move`, {
      targetColumnId: Number(targetColumnId),
      targetTaskId: targetTaskId !== undefined ? Number(targetTaskId) : undefined,
      position,
    }),
};

export default api;
