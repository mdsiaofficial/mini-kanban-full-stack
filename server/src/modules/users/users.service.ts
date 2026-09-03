import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: { email: string; password: string; name?: string }) {
    return this.prisma.db.user.create({
      data,
      select: { id: true, email: true, name: true },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.db.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string) {
    return this.prisma.db.user.findUnique({
      where: { id },
    });
  }

  async findAll() {
    return this.prisma.db.user.findMany({
      select: { id: true, email: true, name: true },
    });
  }

  async saveRefreshToken(userId: string, refreshToken: string) {
    const hashedToken = await bcrypt.hash(refreshToken, 10);
    await this.prisma.db.user.update({
      where: { id: userId },
      data: { refreshToken: hashedToken },
    });
  }

  async removeRefreshToken(userId: string) {
    await this.prisma.db.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }
}
