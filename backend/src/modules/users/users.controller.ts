import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { AuthenticatedRequest } from '../../types/authenticated-request';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @Get('me')
  async findMe(@Req() req: AuthenticatedRequest) {
    return this.usersService.findById(req.user.userId);
  }
}
