import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('boards')
@UseGuards(JwtAuthGuard)
export class BoardsController {
  constructor(private boardsService: BoardsService) {}

  @Post()
  async create(@Body() createBoardDto: CreateBoardDto, @Request() req) {
    return this.boardsService.create(createBoardDto, req.user.userId);
  }

  @Get()
  async findAll(@Request() req) {
    return this.boardsService.findAll(req.user.userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    return this.boardsService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateBoardDto: UpdateBoardDto, @Request() req) {
    return this.boardsService.update(id, updateBoardDto, req.user.userId);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req) {
    return this.boardsService.delete(id, req.user.userId);
  }

  @Post(':id/members')
  async addMember(@Param('id') id: string, @Body() addMemberDto: AddMemberDto, @Request() req) {
    return this.boardsService.addMember(id, addMemberDto, req.user.userId);
  }

  @Delete(':id/members/:userId')
  async removeMember(@Param('id') id: string, @Param('userId') userId: string, @Request() req) {
    return this.boardsService.removeMember(id, userId, req.user.userId);
  }

  @Get(':id/members')
  async getMembers(@Param('id') id: string, @Request() req) {
    return this.boardsService.getMembers(id, req.user.userId);
  }
}
