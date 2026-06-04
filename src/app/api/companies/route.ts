import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sql } from '@/lib/db';
import { apiError } from '@/lib/server/api-response';
import type { Company, GhgEmission } from '@/types';

export const dynamic = 'force-dynamic';

const companyBodySchema = z.object({
    name: z.string().min(1, '회사명을 입력해 주세요.').max(100),
    countryCode: z.string().min(1, '국가를 선택해 주세요.'),
});

type CompanyEmissionRow = {
    id: string;
    name: string;
    country_code: string;
    year_month: string | null;
    source: string | null;
    emissions: number | string | null;
};

function rowToEmission(row: CompanyEmissionRow): GhgEmission | null {
    if (row.year_month === null || row.source === null || row.emissions === null) {
        return null;
    }

    return {
        yearMonth: row.year_month,
        source: row.source,
        emissions: Number(row.emissions),
    };
}

// companies + ghg_emissions flat row를 기존 프론트엔드 Company 타입으로 조립
function rowsToCompanies(rows: CompanyEmissionRow[]): Company[] {
    const companyMap = new Map<string, Company>();

    for (const row of rows) {
        const company = companyMap.get(row.id) ?? {
            id: row.id,
            name: row.name,
            country: row.country_code,
            emissions: [],
        };

        const emission = rowToEmission(row);
        if (emission) {
            company.emissions.push(emission);
        }

        companyMap.set(row.id, company);
    }

    return Array.from(companyMap.values());
}

export async function GET() {
    try {
        const rows = await sql<CompanyEmissionRow[]>`
            SELECT
                c.id,
                c.name,
                c.country_code,
                e.year_month,
                e.source,
                e.emissions
            FROM companies c
            LEFT JOIN ghg_emissions e ON e.company_id = c.id
            ORDER BY c.name ASC, e.year_month ASC, e.source ASC
        `;

        return NextResponse.json(rowsToCompanies(rows));
    } catch {
        return apiError('회사 목록을 불러오지 못했습니다.');
    }
}

export async function POST(request: Request) {
    try {
        const body: unknown = await request.json();
        const parsed = companyBodySchema.safeParse(body);
        if (!parsed.success) {
            return apiError(parsed.error.errors[0]?.message ?? '입력값이 올바르지 않습니다.', 400);
        }

        const { name, countryCode } = parsed.data;
        const id = randomUUID();

        await sql`
            INSERT INTO companies (id, name, country_code)
            VALUES (${id}, ${name}, ${countryCode})
        `;

        return NextResponse.json({ id, name, country: countryCode }, { status: 201 });
    } catch {
        return apiError('회사 등록에 실패했습니다.');
    }
}
