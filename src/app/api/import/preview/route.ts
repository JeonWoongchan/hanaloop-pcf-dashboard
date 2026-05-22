import { parseActivityExcel } from '@/lib/excel-import';
import { apiError } from '@/lib/server/api-response';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Excel 파일을 파싱해 행 미리보기 반환 — DB 저장 없음
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

        return NextResponse.json(result.rows);
    } catch {
        return apiError('파일 파싱에 실패했습니다.', 500);
    }
}
