import { sql } from '@/lib/db';
import { rowToPost } from '@/lib/db-mappers';
import { apiError, shouldFail, simulateDelay } from '@/lib/server/api-response';
import type { Post } from '@/types';
import { NextResponse } from 'next/server';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        // 과제 스펙: 쓰기 요청 200~800ms 지연 + 15% 실패 시뮬레이션
        await simulateDelay();
        if (shouldFail()) return apiError('저장에 실패했습니다. 의도적인 실패입니다.(15%)');
        const { id } = await params;
        const { title, resourceUid, dateTime, content, author } = (await request.json()) as Post;
        const [row] = await sql<Record<string, unknown>[]>`
            UPDATE posts
            SET title = ${title}, resource_uid = ${resourceUid}, date_time = ${dateTime},
                content = ${content}, author = ${author}
            WHERE id = ${id}
            RETURNING id, title, resource_uid, date_time, content, author
        `;
        if (!row) return apiError('게시글을 찾을 수 없습니다.', 404);
        return NextResponse.json(rowToPost(row));
    } catch {
        return apiError('수정에 실패했습니다.');
    }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        // 과제 스펙: 쓰기 요청 200~800ms 지연 시뮬레이션
        await simulateDelay();
        const { id } = await params;
        await sql`DELETE FROM posts WHERE id = ${id}`;
        return new NextResponse(null, { status: 204 });
    } catch {
        return apiError('삭제에 실패했습니다.');
    }
}
