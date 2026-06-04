import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sql } from '@/lib/db';
import { apiError } from '@/lib/server/api-response';
import { SCOPE_MAP } from '@/constants/ghg-scope';

export const dynamic = 'force-dynamic';

const updateSchema = z.object({
    yearMonth: z.string().regex(/^\d{4}-\d{2}$/, '연월은 YYYY-MM 형식이어야 합니다.'),
    source: z.string().refine((v) => v in SCOPE_MAP, { message: '알 수 없는 배출원 코드입니다.' }),
    emissions: z.number().positive('배출량은 0보다 커야 합니다.'),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body: unknown = await request.json();
        const parsed = updateSchema.safeParse(body);
        if (!parsed.success) {
            return apiError(parsed.error.issues[0]?.message ?? '입력값이 올바르지 않습니다.', 400);
        }

        const { yearMonth, source, emissions } = parsed.data;
        const rows = await sql<{ id: string }[]>`
            UPDATE ghg_emissions
            SET year_month = ${yearMonth}, source = ${source}, emissions = ${emissions}
            WHERE id = ${id}
            RETURNING id
        `;

        if (rows.length === 0) return apiError('배출량 레코드를 찾을 수 없습니다.', 404);
        return NextResponse.json({ id, yearMonth, source, emissions });
    } catch {
        return apiError('GHG 배출량 수정에 실패했습니다.');
    }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        await sql`DELETE FROM ghg_emissions WHERE id = ${id}`;
        return new NextResponse(null, { status: 204 });
    } catch {
        return apiError('GHG 배출량 삭제에 실패했습니다.');
    }
}
