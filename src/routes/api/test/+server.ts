import { json } from '@sveltejs/kit';

export async function GET() {
    return json({ message: 'Test endpoint working', timestamp: new Date().toISOString() });
}
