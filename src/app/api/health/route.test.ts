import { describe, expect, it } from 'vitest';
import { dynamic, GET, HEAD, revalidate, runtime } from './route';

describe('/api/health', () => {
    it('캐시되지 않는 동적 Node.js Route Handler로 설정한다', () => {
        expect(dynamic).toBe('force-dynamic');
        expect(revalidate).toBe(0);
        expect(runtime).toBe('nodejs');
    });

    it('GET 요청에 200 상태와 헬스체크 payload를 반환한다', async () => {
        const response = await GET();
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(response.headers.get('Cache-Control')).toContain('no-store');
        expect(body.status).toBe('ok');
        expect(body.service).toBe('hanaloop-pcf-dashboard');
        expect(typeof body.timestamp).toBe('string');
        expect(Number.isFinite(body.uptime)).toBe(true);
    });

    it('HEAD 요청도 UptimeRobot 확인용 200 상태를 반환한다', async () => {
        const response = await HEAD();

        expect(response.status).toBe(200);
        expect(response.headers.get('Cache-Control')).toContain('no-store');
    });
});
