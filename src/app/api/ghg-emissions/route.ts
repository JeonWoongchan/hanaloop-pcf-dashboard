import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { apiError } from '@/lib/server/api-response';
import type { GhgEmissionRecord } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get('companyId')?.trim() ?? '';
        if (!companyId) return apiError('companyId가 필요합니다.', 400);

        const rows = await sql<GhgEmissionRecord[]>`
            SELECT id, year_month AS "yearMonth", source, emissions::float AS emissions
            FROM ghg_emissions
            WHERE company_id = ${companyId}
            ORDER BY year_month ASC, source ASC
        `;

        return NextResponse.json(rows);
    } catch {
        return apiError('GHG 배출량 목록을 불러오지 못했습니다.');
    }
}
