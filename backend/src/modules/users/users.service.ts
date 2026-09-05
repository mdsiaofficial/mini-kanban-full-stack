import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: { email: string; password: string; name?: string }) {
    return this.prisma.user.create({
      data,
      select: { id: true, email: true, name: true },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true },
    });
  }

  async findByIdWithRefreshToken(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, refreshToken: true },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: { id: true, email: true, name: true },
    });
  }

  async saveRefreshToken(userId: number, refreshToken: string) {
    const hashedToken = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedToken },
    });
  }

  async removeRefreshToken(userId: number) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }
}
