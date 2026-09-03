import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { db } from './db';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  get db(): PrismaClient {
    return db;
  }

  async onModuleInit() {
    await db.$connect();
  }

  async onModuleDestroy() {
    await db.$disconnect();
  }
}
