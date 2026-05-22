import { sql } from '@/lib/db';
import { parseActivityExcel } from '@/lib/excel-import';
import { apiError } from '@/lib/server/api-response';
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        const companyId = formData.get('companyId') as string | null;
        const newCompanyName = formData.get('newCompanyName') as string | null;
        const newCompanyCountry = formData.get('newCompanyCountry') as string | null;

        if (!(file instanceof File)) {
            return apiError('파일이 없습니다.', 400);
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const result = parseActivityExcel(buffer);

        if (!result.ok) return apiError(result.error, 400);

        let targetCompanyId: string;

        if (companyId) {
            targetCompanyId = companyId;
        } else if (newCompanyName?.trim() && newCompanyCountry?.trim()) {
            targetCompanyId = randomUUID();
            await sql`
                INSERT INTO companies (id, name, country_code)
                VALUES (${targetCompanyId}, ${newCompanyName.trim()}, ${newCompanyCountry.trim()})
            `;
        } else {
            return apiError('회사를 선택하거나 새 회사 정보를 입력해 주세요.', 400);
        }

        const fileName = file.name;

        // 같은 회사 + 같은 파일명으로 기존 임포트된 데이터 삭제 후 재삽입
        await sql`
            DELETE FROM activity_records
            WHERE company_id = ${targetCompanyId}
              AND import_file_name = ${fileName}
        `;

        // 원본 활동 데이터를 activity_records에 행 단위로 저장 — 중복 집계 없이 그대로 보존
        for (const row of result.rows) {
            await sql`
                INSERT INTO activity_records (
                    company_id,
                    activity_date, year_month,
                    activity_type, description, quantity, unit,
                    source, scope,
                    emission_factor_kg, emissions_kg, emissions_tco2e,
                    import_file_name, import_row_number
                ) VALUES (
                    ${targetCompanyId},
                    ${row.originalDate}, ${row.yearMonth},
                    ${row.activityType}, ${row.description}, ${row.quantity}, ${row.unit},
                    ${row.source}, ${row.scope},
                    ${row.emissionFactorKg}, ${row.emissionsKg}, ${row.emissions},
                    ${fileName}, ${row.rowNumber}
                )
            `;
        }

        return NextResponse.json(
            { inserted: result.rows.length, companyId: targetCompanyId },
            { status: 201 }
        );
    } catch (e) {
        console.error('[/api/import]', e);
        return apiError('임포트에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    }
}
