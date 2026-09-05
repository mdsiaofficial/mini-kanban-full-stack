// import { PrismaClient } from '../../../generated/prisma/client.js';  // wrong path
import { PrismaClient } from '../generated/prisma/client.js'; // correct path
export const db = new PrismaClient();
