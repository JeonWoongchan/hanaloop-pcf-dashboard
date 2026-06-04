import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { parseGhgExcel } from '@/lib/ghg-excel-import';
import { apiError } from '@/lib/server/api-response';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!(file instanceof File)) return apiError('파일이 없습니다.', 400);

        const companyId = (formData.get('companyId') as string | null)?.trim() ?? '';
        if (!companyId) return apiError('대상 회사를 선택해 주세요.', 400);

        const buffer = Buffer.from(await file.arrayBuffer());
        const result = parseGhgExcel(buffer);
        if (!result.ok) return apiError(result.error, 400);

        // 단일 트랜잭션으로 전체 행 upsert — 중간 실패 시 전체 롤백
        await sql.begin(async (tx) => {
            for (const row of result.rows) {
                await tx`
                    INSERT INTO ghg_emissions (company_id, year_month, source, emissions)
                    VALUES (${companyId}, ${row.yearMonth}, ${row.source}, ${row.emissions})
                    ON CONFLICT (company_id, year_month, source)
                    DO UPDATE SET emissions = EXCLUDED.emissions
                `;
            }
        });

        return NextResponse.json({ upserted: result.rows.length, companyId }, { status: 201 });
    } catch (error) {
        console.error('[/api/ghg-emissions/import]', error);
        return apiError('GHG 배출량 임포트에 실패했습니다.');
    }
}
