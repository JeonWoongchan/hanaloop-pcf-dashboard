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

        // UNIQUE (company_id, year_month, source) 기반 행 단위 upsert
        let upserted = 0;
        for (const row of result.rows) {
            await sql`
                INSERT INTO ghg_emissions (company_id, year_month, source, emissions)
                VALUES (${companyId}, ${row.yearMonth}, ${row.source}, ${row.emissions})
                ON CONFLICT (company_id, year_month, source)
                DO UPDATE SET emissions = EXCLUDED.emissions
            `;
            upserted++;
        }

        return NextResponse.json({ upserted, companyId }, { status: 201 });
    } catch (error) {
        console.error('[/api/ghg-emissions/import]', error);
        return apiError('GHG 배출량 임포트에 실패했습니다.');
    }
}
