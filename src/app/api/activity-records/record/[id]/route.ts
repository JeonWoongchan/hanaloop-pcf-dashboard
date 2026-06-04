import { sql } from '@/lib/db';
import { apiError } from '@/lib/server/api-response';

export const dynamic = 'force-dynamic';

type RouteParams = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        await sql`DELETE FROM activity_records WHERE id = ${id}`;
        return new Response(null, { status: 204 });
    } catch {
        return apiError('활동 데이터 삭제에 실패했습니다.');
    }
}
