import { hashPassword, createUser, createSession, createSessionCookie } from '$lib/server/auth';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
  const { username, password } = await request.json();

  if (!username || !password) {
    return new Response('Missing username or password', { status: 400 });
  }

  const passwordHash = await hashPassword(password);
  const user = await createUser(username, passwordHash);
  const session = await createSession(user.id);
  const cookie = createSessionCookie(session.id);

  return new Response(null, {
    headers: {
      'Set-Cookie': cookie,
    },
  });
};
