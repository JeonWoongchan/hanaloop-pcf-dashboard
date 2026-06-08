import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL;
const sslMode = process.env.POSTGRES_SSL?.toLowerCase() ?? getSslModeFromUrl(databaseUrl);

if (!databaseUrl) {
    throw new Error(
        'DATABASE_URL 환경 변수가 설정되어 있지 않습니다. pnpm dev/start 또는 Vercel 배포 시 Neon DATABASE_URL을 설정해야 합니다.'
    );
}

type SqlClient = ReturnType<typeof postgres>;
type PostgresSslMode = 'require' | 'allow' | 'prefer' | 'verify-full';

const globalForPostgres = globalThis as typeof globalThis & {
    carbonflowSql?: SqlClient;
};

function getPostgresSslOption(): false | PostgresSslMode {
    if (!sslMode || sslMode === 'false' || sslMode === '0' || sslMode === 'disable') {
        return false;
    }

    if (sslMode === 'true' || sslMode === '1') {
        return 'require';
    }

    if (
        sslMode === 'require' ||
        sslMode === 'allow' ||
        sslMode === 'prefer' ||
        sslMode === 'verify-full'
    ) {
        return sslMode;
    }

    throw new Error(
        'POSTGRES_SSL 환경 변수는 true, false, require, allow, prefer, verify-full 중 하나여야 합니다.'
    );
}

function getSslModeFromUrl(url: string | undefined): string | undefined {
    if (!url) return undefined;

    try {
        return new URL(url).searchParams.get('sslmode')?.toLowerCase();
    } catch {
        return undefined;
    }
}

export const sql =
    globalForPostgres.carbonflowSql ??
    postgres(databaseUrl, {
        ssl: getPostgresSslOption(),
    });

if (process.env.NODE_ENV !== 'production') {
    globalForPostgres.carbonflowSql = sql;
}
