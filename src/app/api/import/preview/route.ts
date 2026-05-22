import { NextResponse } from 'next/server';
import { parseActivityExcel } from '@/lib/excel-import';
import { apiError } from '@/lib/server/api-response';
import { applyEmissionFactors } from '@/lib/server/emission-factors';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!(file instanceof File)) {
            return apiError('파일이 없습니다.', 400);
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const result = parseActivityExcel(buffer);

        if (!result.ok) return apiError(result.error, 400);

        const factorResult = await applyEmissionFactors(result.rows);
        if (!factorResult.ok) return apiError(factorResult.error, 400);

        return NextResponse.json(factorResult.rows);
    } catch (error) {
        console.error('[/api/import/preview]', error);
        return apiError('파일 파싱에 실패했습니다.', 500);
    }
}
