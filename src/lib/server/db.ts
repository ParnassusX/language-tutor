// Singleton PrismaClient instance to avoid connection pool exhaustion
// This pattern ensures only one client is created across the application

import { PrismaClient } from '@prisma/client';
import { dev } from '$app/environment';

let prisma: PrismaClient;

if (dev) {
  // In development, use a global variable to preserve the client across hot reloads
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
  }
  prisma = global.prisma;
} else {
  // In production, create a new client
  prisma = new PrismaClient({
    log: ['error', 'warn'],
  });
}

// Graceful shutdown
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}

export { prisma };
