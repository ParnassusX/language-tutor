import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
const { sign, verify } = jwt;
import { hash, compare } from 'bcrypt';
import { env } from '$env/dynamic/private';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();
const JWT_SECRET = env.JWT_SECRET || 'secret';

if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'secret') {
  console.warn('⚠️ WARNING: JWT_SECRET is set to default "secret" in production! Please set a secure JWT_SECRET.');
}

export async function hashPassword(password: string) {
  return await hash(password, 10);
}

export async function createUser(username: string, passwordHash: string) {
  return await prisma.user.create({
    data: {
      id: uuidv4(),
      username,
      password: passwordHash,
    },
  });
}

export async function verifyPassword(password: string, passwordHash: string) {
  return await compare(password, passwordHash);
}

export async function createSession(userId: string) {
  const id = uuidv4();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days
  const session = await prisma.session.create({
    data: {
      id,
      userId,
      expiresAt,
    },
  });
  return session;
}

export function createSessionCookie(sessionId: string) {
  const token = sign({ sessionId }, JWT_SECRET, { expiresIn: '7d' });
  const isProd = process.env.NODE_ENV === 'production';
  return `session=${token}; HttpOnly; Path=/; Max-Age=604800${isProd ? '; Secure; SameSite=Lax' : ''}`;
}

export async function verifySession(token: string) {
  try {
    const { sessionId } = verify(token, JWT_SECRET) as { sessionId: string };
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });
    if (session && session.expiresAt > new Date()) {
      return session;
    }
    return null;
  } catch {
    return null;
  }
}

export async function deleteSession(sessionId: string) {
  await prisma.session.delete({ where: { id: sessionId } });
}
