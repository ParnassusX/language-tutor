import { deleteSession } from '$lib/server/auth';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ cookies }) => {
  const session = cookies.get('session');
  if (session) {
    await deleteSession(session);
  }

  return new Response(null, {
    headers: {
      'Set-Cookie': 'session=; HttpOnly; Path=/; Max-Age=0',
    },
  });
};
