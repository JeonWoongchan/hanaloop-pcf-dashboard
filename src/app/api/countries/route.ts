import { sql } from '@/lib/db';
import { rowToCountry } from '@/lib/db-mappers';
import { apiError } from '@/lib/server/api-response';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const rows = await sql<Record<string, unknown>[]>`
            SELECT code, name
            FROM countries
            ORDER BY name ASC
        `;
        return NextResponse.json(rows.map(rowToCountry));
    } catch {
        return apiError('국가 목록을 불러오지 못했습니다.');
    }
}
