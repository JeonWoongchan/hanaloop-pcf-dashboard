import type { Country, Post } from '@/types';

type DbRow = Record<string, unknown>;

// DB row → Country 타입 변환
export function rowToCountry(row: DbRow): Country {
    return {
        code: row.code as string,
        name: row.name as string,
    };
}

// DB row → Post 타입 변환 (snake_case → camelCase)
export function rowToPost(row: DbRow): Post {
    return {
        id: row.id as string,
        title: row.title as string,
        resourceUid: row.resource_uid as string,
        dateTime: row.date_time as string,
        content: row.content as string,
        author: row.author as string,
    };
}
