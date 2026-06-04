import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { parseActivityExcel } from '@/lib/excel-import';
import { apiError } from '@/lib/server/api-response';
import { applyEmissionFactors } from '@/lib/server/emission-factors';

export const dynamic = 'force-dynamic';

const MISSING_FILE_MESSAGE = '파일이 없습니다.';
const MISSING_COMPANY_MESSAGE = '대상 회사를 선택해 주세요.';
const EMPTY_FILE_NAME_MESSAGE = '파일명이 비어 있습니다.';
const IMPORT_ERROR_MESSAGE = '임포트에 실패했습니다. 잠시 후 다시 시도해 주세요.';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!(file instanceof File)) return apiError(MISSING_FILE_MESSAGE, 400);

        const companyId = (formData.get('companyId') as string | null)?.trim() ?? '';
        if (!companyId) return apiError(MISSING_COMPANY_MESSAGE, 400);

        const fileName = file.name.trim();
        if (!fileName) return apiError(EMPTY_FILE_NAME_MESSAGE, 400);

        const buffer = Buffer.from(await file.arrayBuffer());
        const result = parseActivityExcel(buffer);
        if (!result.ok) return apiError(result.error, 400);

        const factorResult = await applyEmissionFactors(result.rows);
        if (!factorResult.ok) return apiError(factorResult.error, 400);

        await sql.begin('isolation level serializable', async (tx) => {
            await tx`
                DELETE FROM activity_records
                WHERE company_id = ${companyId}
                  AND import_file_name = ${fileName}
            `;

            for (const row of factorResult.rows) {
                await tx`
                    INSERT INTO activity_records (
                        company_id,
                        emission_factor_id,
                        activity_date, year_month,
                        activity_type, description, quantity, unit,
                        source, scope,
                        emission_factor_kg, emissions_kg, emissions_tco2e,
                        import_file_name, import_row_number
                    ) VALUES (
                        ${companyId},
                        ${row.emissionFactorId},
                        ${row.originalDate}, ${row.yearMonth},
                        ${row.activityType}, ${row.description}, ${row.quantity}, ${row.unit},
                        ${row.source}, ${row.scope},
                        ${row.emissionFactorKg}, ${row.emissionsKg}, ${row.emissions},
                        ${fileName}, ${row.rowNumber}
                    )
                `;
            }
        });

        return NextResponse.json(
            { inserted: factorResult.rows.length, companyId },
            { status: 201 }
        );
    } catch (error) {
        console.error('[/api/import]', error);
        return apiError(IMPORT_ERROR_MESSAGE);
    }
}
