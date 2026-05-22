import { sql } from '@/lib/db';
import { rowToPost } from '@/lib/db-mappers';
import { apiError } from '@/lib/server/api-response';
import type { Post } from '@/types';
import { NextResponse } from 'next/server';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const { title, resourceUid, dateTime, content, author } = (await request.json()) as Post;
        const [row] = await sql`
            UPDATE posts
            SET title = ${title}, resource_uid = ${resourceUid}, date_time = ${dateTime},
                content = ${content}, author = ${author}
            WHERE id = ${id}
            RETURNING id, title, resource_uid, date_time, content, author
        `;
        if (!row) return apiError('게시글을 찾을 수 없습니다.', 404);
        return NextResponse.json(rowToPost(row as Record<string, unknown>));
    } catch {
        return apiError('수정에 실패했습니다.');
    }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await sql`DELETE FROM posts WHERE id = ${id}`;
        return new NextResponse(null, { status: 204 });
    } catch {
        return apiError('삭제에 실패했습니다.');
    }
}
