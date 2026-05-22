import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error('DATABASE_URL 환경 변수가 설정되어 있지 않습니다.');
}

type SqlClient = ReturnType<typeof postgres>;

const globalForPostgres = globalThis as typeof globalThis & {
    hanaloopSql?: SqlClient;
};

export const sql =
    globalForPostgres.hanaloopSql ??
    postgres(databaseUrl, {
        ssl: false,
    });

if (process.env.NODE_ENV !== 'production') {
    globalForPostgres.hanaloopSql = sql;
}
