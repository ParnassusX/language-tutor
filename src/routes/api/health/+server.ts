import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
    console.log('🎯 GET /api/health - Health check request received');

    try {
        return json({
            status: 'ok',
            message: 'Server is healthy',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Health check error:', error);
        return json({
            status: 'error',
            message: 'Health check failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
};

export const POST: RequestHandler = async ({ request }) => {
    console.log('🎯 POST /api/health - Health check POST request received');

    try {
        const body = await request.json().catch(() => ({}));
        console.log('📝 POST body:', body);

        return json({
            status: 'ok',
            message: 'Server is healthy (POST)',
            timestamp: new Date().toISOString(),
            receivedData: body
        });
    } catch (error) {
        console.error('❌ Health check POST error:', error);
        return json({
            status: 'error',
            message: 'Health check POST failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
};
