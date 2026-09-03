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
  userId?: string;
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

  private userSockets: Map<string, Set<string>> = new Map();
  private socketUsers: Map<string, string> = new Map();

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

      client.userId = payload.sub;

      if (!this.userSockets.has(payload.sub)) {
        this.userSockets.set(payload.sub, new Set());
      }
      this.userSockets.get(payload.sub).add(client.id);
      this.socketUsers.set(client.id, payload.sub);

      console.log(`Client connected: ${client.id} (user: ${payload.sub})`);
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
      await this.boardsService.findOne(data.boardId, client.userId);
      client.join(`board:${data.boardId}`);
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
    client.leave(`board:${data.boardId}`);
    return { success: true };
  }

  emitTaskMoved(boardId: string, data: { taskId: string; fromColumnId: string; toColumnId: string; newOrder: number }) {
    this.server.to(`board:${boardId}`).emit('task:moved', data);
  }

  emitTaskCreated(boardId: string, data: { task: any; columnId: string }) {
    this.server.to(`board:${boardId}`).emit('task:created', data);
  }

  emitTaskUpdated(boardId: string, data: { task: any }) {
    this.server.to(`board:${boardId}`).emit('task:updated', data);
  }

  emitTaskDeleted(boardId: string, data: { taskId: string; columnId: string }) {
    this.server.to(`board:${boardId}`).emit('task:deleted', data);
  }

  emitColumnCreated(boardId: string, data: { column: any }) {
    this.server.to(`board:${boardId}`).emit('column:created', data);
  }

  emitColumnUpdated(boardId: string, data: { column: any }) {
    this.server.to(`board:${boardId}`).emit('column:updated', data);
  }

  emitColumnDeleted(boardId: string, data: { columnId: string }) {
    this.server.to(`board:${boardId}`).emit('column:deleted', data);
  }

  emitBoardUpdated(boardId: string, data: { board: any }) {
    this.server.to(`board:${boardId}`).emit('board:updated', data);
  }
}
