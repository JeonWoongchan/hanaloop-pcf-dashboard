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

export async function GET() {
    try {
        // 가장 최근 effective_from 레코드를 현재 단가로 사용 — 배출계수 조회와 동일 패턴
        const rows = await sql<AllowancePriceRow[]>`
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
