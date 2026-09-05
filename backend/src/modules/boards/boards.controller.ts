import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req, ParseIntPipe } from '@nestjs/common';
import type { Request } from 'express';
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
  async create(@Body() createBoardDto: CreateBoardDto, @Req() req: Request) {
    return this.boardsService.create(createBoardDto, req.user.userId);
  }

  @Get()
  async findAll(@Req() req: Request) {
    return this.boardsService.findAll(req.user.userId);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.boardsService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateBoardDto: UpdateBoardDto, @Req() req: Request) {
    return this.boardsService.update(id, updateBoardDto, req.user.userId);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.boardsService.delete(id, req.user.userId);
  }

  @Post(':id/members')
  async addMember(@Param('id', ParseIntPipe) id: number, @Body() addMemberDto: AddMemberDto, @Req() req: Request) {
    return this.boardsService.addMember(id, addMemberDto, req.user.userId);
  }

  @Delete(':id/members/:userId')
  async removeMember(@Param('id', ParseIntPipe) id: number, @Param('userId', ParseIntPipe) userId: number, @Req() req: Request) {
    return this.boardsService.removeMember(id, userId, req.user.userId);
  }

  @Get(':id/members')
  async getMembers(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.boardsService.getMembers(id, req.user.userId);
  }
}
