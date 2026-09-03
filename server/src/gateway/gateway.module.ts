import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { KanbanGateway } from './kanban.gateway';
import { BoardsModule } from '../modules/boards/boards.module';

@Module({
  imports: [
    forwardRef(() => BoardsModule),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '15m' },
    }),
  ],
  providers: [KanbanGateway],
  exports: [KanbanGateway],
})
export class GatewayModule {}
