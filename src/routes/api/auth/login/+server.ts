import { verifyPassword, createSession, createSessionCookie } from '$lib/server/auth';
import { PrismaClient } from '@prisma/client';
import type { RequestHandler } from '@sveltejs/kit';

const prisma = new PrismaClient();

export const POST: RequestHandler = async ({ request }) => {
  const { username, password } = await request.json();

  if (!username || !password) {
    return new Response('Missing username or password', { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    return new Response('Invalid username or password', { status: 400 });
  }

  const validPassword = await verifyPassword(password, user.password);
  if (!validPassword) {
    return new Response('Invalid username or password', { status: 400 });
  }

  const session = await createSession(user.id);
  const cookie = createSessionCookie(session.id);

  return new Response(null, {
    headers: {
      'Set-Cookie': cookie,
    },
  });
};
