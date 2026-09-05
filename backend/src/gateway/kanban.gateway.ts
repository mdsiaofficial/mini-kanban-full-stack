import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { BoardsService } from '../modules/boards/boards.service';

interface AuthenticatedSocket extends Socket {
  userId?: number;
}

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:8000'],
    credentials: true,
  },
})
export class KanbanGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets: Map<number, Set<string>> = new Map();
  private socketUsers: Map<string, number> = new Map();

  constructor(
    private jwtService: JwtService,
    private boardsService: BoardsService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth?.token || 
                     client.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });

      client.userId = Number(payload.sub);

      if (!this.userSockets.has(client.userId)) {
        this.userSockets.set(client.userId, new Set());
      }
      this.userSockets.get(client.userId).add(client.id);
      this.socketUsers.set(client.id, client.userId);

      console.log(`Client connected: ${client.id} (user: ${client.userId})`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      const userSocketSet = this.userSockets.get(client.userId);
      if (userSocketSet) {
        userSocketSet.delete(client.id);
        if (userSocketSet.size === 0) {
          this.userSockets.delete(client.userId);
        }
      }
      this.socketUsers.delete(client.id);
    }
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinBoard')
  async handleJoinBoard(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { boardId: string },
  ) {
    if (!client.userId) {
      return { error: 'Unauthorized' };
    }

    try {
      const boardId = Number(data.boardId);
      await this.boardsService.findOne(boardId, client.userId);
      client.join(`board:${boardId}`);
      return { success: true };
    } catch {
      return { error: 'Access denied' };
    }
  }

  @SubscribeMessage('leaveBoard')
  handleLeaveBoard(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { boardId: string },
  ) {
    const boardId = Number(data.boardId);
    client.leave(`board:${boardId}`);
    return { success: true };
  }

  emitTaskMoved(boardId: number, data: { taskId: number; fromColumnId: number; toColumnId: number; newOrder: number }) {
    this.server.to(`board:${boardId}`).emit('task:moved', data);
  }

  emitTaskCreated(boardId: number, data: { task: any; columnId: number }) {
    this.server.to(`board:${boardId}`).emit('task:created', data);
  }

  emitTaskUpdated(boardId: number, data: { task: any }) {
    this.server.to(`board:${boardId}`).emit('task:updated', data);
  }

  emitTaskDeleted(boardId: number, data: { taskId: number; columnId: number }) {
    this.server.to(`board:${boardId}`).emit('task:deleted', data);
  }

  emitColumnCreated(boardId: number, data: { column: any }) {
    this.server.to(`board:${boardId}`).emit('column:created', data);
  }

  emitColumnUpdated(boardId: number, data: { column: any }) {
    this.server.to(`board:${boardId}`).emit('column:updated', data);
  }

  emitColumnDeleted(boardId: number, data: { columnId: number }) {
    this.server.to(`board:${boardId}`).emit('column:deleted', data);
  }

  emitBoardUpdated(boardId: number, data: { board: any }) {
    this.server.to(`board:${boardId}`).emit('board:updated', data);
  }
}
