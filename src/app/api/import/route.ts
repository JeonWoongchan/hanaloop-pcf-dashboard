import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { parseActivityExcel } from '@/lib/excel-import';
import { apiError } from '@/lib/server/api-response';

export const dynamic = 'force-dynamic';

const MISSING_FILE_MESSAGE = '파일이 없습니다.';
const MISSING_COMPANY_MESSAGE = '회사를 선택하거나 새 회사 정보를 입력해 주세요.';
const EMPTY_FILE_NAME_MESSAGE = '파일명이 비어 있습니다.';
const IMPORT_ERROR_MESSAGE = '임포트에 실패했습니다. 잠시 후 다시 시도해 주세요.';

type ImportTarget =
    | { companyId: string; shouldCreateCompany: false }
    | {
          companyId: string;
          shouldCreateCompany: true;
          companyName: string;
          countryCode: string;
      };

type ImportTargetResult = { ok: true; target: ImportTarget } | { ok: false; message: string };

function getFormText(formData: FormData, key: string): string {
    const value = formData.get(key);
    return typeof value === 'string' ? value.trim() : '';
}

function resolveImportTarget(
    existingCompanyId: string,
    newCompanyName: string,
    newCompanyCountry: string
): ImportTargetResult {
    if (existingCompanyId) {
        return { ok: true, target: { companyId: existingCompanyId, shouldCreateCompany: false } };
    }

    if (newCompanyName && newCompanyCountry) {
        return {
            ok: true,
            target: {
                companyId: randomUUID(),
                shouldCreateCompany: true,
                companyName: newCompanyName,
                countryCode: newCompanyCountry,
            },
        };
    }

    return { ok: false, message: MISSING_COMPANY_MESSAGE };
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!(file instanceof File)) {
            return apiError(MISSING_FILE_MESSAGE, 400);
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const result = parseActivityExcel(buffer);

        if (!result.ok) return apiError(result.error, 400);

        const targetResult = resolveImportTarget(
            getFormText(formData, 'companyId'),
            getFormText(formData, 'newCompanyName'),
            getFormText(formData, 'newCompanyCountry')
        );

        if (!targetResult.ok) return apiError(targetResult.message, 400);

        const fileName = file.name.trim();
        if (!fileName) return apiError(EMPTY_FILE_NAME_MESSAGE, 400);

        const { target } = targetResult;

        await sql.begin('isolation level serializable', async (tx) => {
            if (target.shouldCreateCompany) {
                await tx`
                    INSERT INTO companies (id, name, country_code)
                    VALUES (${target.companyId}, ${target.companyName}, ${target.countryCode})
                `;
            }

            await tx`
                    DELETE FROM activity_records
                    WHERE company_id = ${target.companyId}
                      AND import_file_name = ${fileName}
                `;

            for (const row of result.rows) {
                await tx`
                        INSERT INTO activity_records (
                            company_id,
                            activity_date, year_month,
                            activity_type, description, quantity, unit,
                            source, scope,
                            emission_factor_kg, emissions_kg, emissions_tco2e,
                            import_file_name, import_row_number
                        ) VALUES (
                            ${target.companyId},
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
            { inserted: result.rows.length, companyId: target.companyId },
            { status: 201 }
        );
    } catch (error) {
        console.error('[/api/import]', error);
        return apiError(IMPORT_ERROR_MESSAGE);
    }
}
