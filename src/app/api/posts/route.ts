import { sql } from '@/lib/db';
import { rowToPost } from '@/lib/db-mappers';
import { apiError } from '@/lib/server/api-response';
import type { Post } from '@/types';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const rows = await sql`
            SELECT id, title, resource_uid, date_time, content, author
            FROM posts
            ORDER BY created_at DESC
        `;
        return NextResponse.json(rows.map(rowToPost));
    } catch {
        return apiError('게시글을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
    }
}

export async function POST(request: Request) {
    try {
        // 과제 초기 구현사항에 맞게 15% 확률로 의도적으로 실패하도록 구현
        if (Math.random() < 0.15)
            return apiError('저장에 실패했습니다. 잠시 후 다시 시도해 주세요.');

        const { title, resourceUid, dateTime, content, author } = (await request.json()) as Post;
        const [row] = await sql`
            INSERT INTO posts (title, resource_uid, date_time, content, author)
            VALUES (${title}, ${resourceUid}, ${dateTime}, ${content}, ${author})
            RETURNING id, title, resource_uid, date_time, content, author
        `;
        return NextResponse.json(rowToPost(row as Record<string, unknown>), { status: 201 });
    } catch {
        return apiError('저장에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    }
}
