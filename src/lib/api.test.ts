import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Post } from '@/types';

type ApiModule = typeof import('./api');

const NEW_POST_ID = '11111111-1111-4111-8111-111111111111';

async function importFreshApi(): Promise<ApiModule> {
    vi.resetModules();
    return import('./api');
}

async function resolveApiCall<T>(promise: Promise<T>): Promise<T> {
    const settledPromise = promise.then(
        (value) => ({ status: 'fulfilled' as const, value }),
        (reason: unknown) => ({ status: 'rejected' as const, reason })
    );
    await vi.advanceTimersByTimeAsync(1000);
    const settled = await settledPromise;
    if (settled.status === 'rejected') throw settled.reason;
    return settled.value;
}

function makePost(overrides: Partial<Omit<Post, 'id'>> = {}): Omit<Post, 'id'> {
    return {
        title: '감축 조치 메모',
        resourceUid: 'c1',
        dateTime: '2026-05-22 15:00',
        content: '전력 사용량 감축 조치를 기록했습니다.',
        author: 'QA 담당자',
        ...overrides,
    };
}

beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
});

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe('fake api', () => {
    it('초기 국가·회사·Action Note 목록을 비동기로 반환한다', async () => {
        const api = await importFreshApi();

        const countries = await resolveApiCall(api.fetchCountries());
        const companies = await resolveApiCall(api.fetchCompanies());
        const posts = await resolveApiCall(api.fetchPosts());

        expect(countries).toContainEqual({ code: 'KR', name: 'South Korea' });
        expect(companies.some((company) => company.id === 'c1')).toBe(true);
        expect(posts.some((post) => post.id === 'p1' && post.resourceUid === 'c1')).toBe(true);
    });

    it('새 Action Note를 생성하고 이후 조회 결과에 반영한다', async () => {
        const api = await importFreshApi();
        vi.stubGlobal('crypto', { randomUUID: vi.fn(() => NEW_POST_ID) });

        const created = await resolveApiCall(api.createOrUpdatePost(makePost()));
        const posts = await resolveApiCall(api.fetchPosts());

        expect(created).toMatchObject({
            id: NEW_POST_ID,
            resourceUid: 'c1',
            title: '감축 조치 메모',
            author: 'QA 담당자',
        });
        expect(posts.find((post) => post.id === NEW_POST_ID)).toEqual(created);
    });

    it('기존 Action Note를 id 기준으로 수정한다', async () => {
        const api = await importFreshApi();

        const updated = await resolveApiCall(api.createOrUpdatePost({
            id: 'p1',
            ...makePost({
                title: '수정된 대응 기록',
                content: '기존 메모 내용을 수정했습니다.',
                author: '검토자',
            }),
        }));
        const posts = await resolveApiCall(api.fetchPosts());

        expect(updated).toMatchObject({
            id: 'p1',
            title: '수정된 대응 기록',
            content: '기존 메모 내용을 수정했습니다.',
            author: '검토자',
        });
        expect(posts.find((post) => post.id === 'p1')).toEqual(updated);
    });

    it('Action Note를 삭제하고 이후 조회 결과에서 제외한다', async () => {
        const api = await importFreshApi();

        await resolveApiCall(api.deletePost('p1'));
        const posts = await resolveApiCall(api.fetchPosts());

        expect(posts.some((post) => post.id === 'p1')).toBe(false);
    });

    it('저장 실패 시 Action Note 목록을 변경하지 않는다', async () => {
        const randomSpy = vi.spyOn(Math, 'random');
        randomSpy.mockReset();
        randomSpy
            .mockReturnValueOnce(0.5)
            .mockReturnValueOnce(0.1)
            .mockReturnValue(0.5);
        const api = await importFreshApi();
        vi.stubGlobal('crypto', { randomUUID: vi.fn(() => NEW_POST_ID) });

        await expect(resolveApiCall(api.createOrUpdatePost(makePost()))).rejects.toThrow(
            '저장에 실패했습니다. 다시 시도해 주세요.'
        );
        const posts = await resolveApiCall(api.fetchPosts());

        expect(posts.some((post) => post.id === NEW_POST_ID)).toBe(false);
        expect(posts.some((post) => post.id === 'p1')).toBe(true);
    });

    it('삭제 실패 시 기존 Action Note를 보존한다', async () => {
        const randomSpy = vi.spyOn(Math, 'random');
        randomSpy.mockReset();
        randomSpy
            .mockReturnValueOnce(0.5)
            .mockReturnValueOnce(0.1)
            .mockReturnValue(0.5);
        const api = await importFreshApi();

        await expect(resolveApiCall(api.deletePost('p1'))).rejects.toThrow(
            '삭제에 실패했습니다. 다시 시도해 주세요.'
        );
        const posts = await resolveApiCall(api.fetchPosts());

        expect(posts.some((post) => post.id === 'p1')).toBe(true);
    });
});
