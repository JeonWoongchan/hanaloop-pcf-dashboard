import { NextResponse } from 'next/server';
import { SERVICE_ID } from '@/constants/service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

const HEALTH_HEADERS = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    Pragma: 'no-cache',
} as const;

export async function GET() {
    return NextResponse.json(
        {
            status: 'ok',
            service: SERVICE_ID,
            timestamp: new Date().toISOString(),
            uptime: Math.round(process.uptime()),
        },
        { headers: HEALTH_HEADERS }
    );
}

export async function HEAD() {
    return new Response(null, {
        status: 200,
        headers: HEALTH_HEADERS,
    });
}
