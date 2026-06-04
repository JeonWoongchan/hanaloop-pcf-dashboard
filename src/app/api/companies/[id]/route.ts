import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sql } from '@/lib/db';
import { apiError } from '@/lib/server/api-response';

export const dynamic = 'force-dynamic';

const companyBodySchema = z.object({
    name: z.string().min(1, '회사명을 입력해 주세요.').max(100),
    countryCode: z.string().min(1, '국가를 선택해 주세요.'),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body: unknown = await request.json();
        const parsed = companyBodySchema.safeParse(body);
        if (!parsed.success) {
            return apiError(parsed.error.errors[0]?.message ?? '입력값이 올바르지 않습니다.', 400);
        }

        const { name, countryCode } = parsed.data;
        const rows = await sql<{ id: string }[]>`
            UPDATE companies
            SET name = ${name}, country_code = ${countryCode}
            WHERE id = ${id}
            RETURNING id
        `;

        if (rows.length === 0) return apiError('회사를 찾을 수 없습니다.', 404);

        return NextResponse.json({ id, name, country: countryCode });
    } catch {
        return apiError('회사 수정에 실패했습니다.');
    }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;

        // ghg_emissions에 ON DELETE CASCADE가 없으므로 먼저 삭제
        await sql.begin(async (tx) => {
            await tx`DELETE FROM ghg_emissions WHERE company_id = ${id}`;
            await tx`DELETE FROM posts WHERE resource_uid = ${id}`;
            await tx`DELETE FROM companies WHERE id = ${id}`;
        });

        return new NextResponse(null, { status: 204 });
    } catch {
        return apiError('회사 삭제에 실패했습니다.');
    }
}
