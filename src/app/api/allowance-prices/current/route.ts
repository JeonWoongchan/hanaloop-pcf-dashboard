import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { apiError } from '@/lib/server/api-response';
import type { AllowancePrice } from '@/types';

export const dynamic = 'force-dynamic';

type AllowancePriceRow = {
    id: string;
    price_krw: string | number;
    effective_from: string;
    note: string | null;
};

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const yearParam = searchParams.get('year');
        const year = yearParam ? Number(yearParam) : null;

        // year가 주어지면 해당 연도 말일 이전 최신 단가, 없으면 전체 최신 단가
        const rows = year
            ? await sql<AllowancePriceRow[]>`
                SELECT id, price_krw, effective_from::text, note
                FROM allowance_prices
                WHERE effective_from <= make_date(${year}, 12, 31)
                ORDER BY effective_from DESC, created_at DESC
                LIMIT 1
              `
            : await sql<AllowancePriceRow[]>`
                SELECT id, price_krw, effective_from::text, note
                FROM allowance_prices
                ORDER BY effective_from DESC, created_at DESC
                LIMIT 1
              `;

        if (rows.length === 0) return apiError('등록된 배출권 단가가 없습니다.', 404);

        const row = rows[0]!;
        const price: AllowancePrice = {
            id: row.id,
            priceKrw: Number(row.price_krw),
            effectiveFrom: row.effective_from,
            note: row.note,
        };

        return NextResponse.json(price);
    } catch {
        return apiError('배출권 단가를 불러오지 못했습니다.');
    }
}
