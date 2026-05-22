import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Post } from '@/types';

type ApiModule = typeof import('./api');

const createdPost: Post = {
    id: 'new-post-id',
    title: '감축 조치 메모',
    resourceUid: 'c1',
    dateTime: '2026-05-22 15:00',
    content: '전력 사용량 감축 조치를 기록했습니다.',
    author: 'QA 담당자',
};

async function importFreshApi(): Promise<ApiModule> {
    vi.resetModules();
    return import('./api');
}

async function resolveDelayedApiCall<T>(promise: Promise<T>): Promise<T> {
    const settledPromise = promise.then(
        (value) => ({ status: 'fulfilled' as const, value }),
        (reason: unknown) => ({ status: 'rejected' as const, reason })
    );
    await vi.advanceTimersByTimeAsync(1000);
    const settled = await settledPromise;
    if (settled.status === 'rejected') throw settled.reason;
    return settled.value;
}

function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

function mockFetch(response: Response): ReturnType<typeof vi.fn> {
    const fetchMock = vi.fn<(...args: Parameters<typeof fetch>) => Promise<Response>>();
    fetchMock.mockResolvedValue(response);
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
}

function makePost(overrides: Partial<Omit<Post, 'id'>> = {}): Omit<Post, 'id'> {
    return {
        title: createdPost.title,
        resourceUid: createdPost.resourceUid,
        dateTime: createdPost.dateTime,
        content: createdPost.content,
        author: createdPost.author,
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

describe('api wrappers', () => {
    it('국가·회사 목록은 현재 seed 데이터를 비동기로 반환한다', async () => {
        const api = await importFreshApi();

        const countries = await resolveDelayedApiCall(api.fetchCountries());
        const companies = await resolveDelayedApiCall(api.fetchCompanies());

        expect(countries).toContainEqual({ code: 'KR', name: 'South Korea' });
        expect(companies.some((company) => company.id === 'c1')).toBe(true);
    });

    it('Action Notes 목록을 Route Handler에서 가져온다', async () => {
        const fetchMock = mockFetch(jsonResponse([createdPost]));
        const api = await importFreshApi();

        const posts = await api.fetchPosts();

        expect(fetchMock).toHaveBeenCalledWith('/api/posts');
        expect(posts).toEqual([createdPost]);
    });

    it('Action Notes 목록 조회 실패를 사용자 메시지용 Error로 변환한다', async () => {
        mockFetch(jsonResponse({ error: 'server error' }, 500));
        const api = await importFreshApi();

        await expect(api.fetchPosts()).rejects.toThrow('게시글을 불러오지 못했습니다.');
    });

    it('새 Action Note는 POST 요청으로 저장한다', async () => {
        const fetchMock = mockFetch(jsonResponse(createdPost, 201));
        const api = await importFreshApi();
        const payload = makePost();

        const saved = await api.createOrUpdatePost(payload);

        expect(fetchMock).toHaveBeenCalledWith('/api/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        expect(saved).toEqual(createdPost);
    });

    it('기존 Action Note는 PUT 요청으로 수정한다', async () => {
        const fetchMock = mockFetch(jsonResponse(createdPost));
        const api = await importFreshApi();
        const payload = { id: createdPost.id, ...makePost({ title: '수정된 대응 기록' }) };

        const saved = await api.createOrUpdatePost(payload);

        expect(fetchMock).toHaveBeenCalledWith(`/api/posts/${createdPost.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        expect(saved).toEqual(createdPost);
    });

    it('Action Note 저장 실패를 사용자 메시지용 Error로 변환한다', async () => {
        mockFetch(jsonResponse({ error: 'server error' }, 500));
        const api = await importFreshApi();

        await expect(api.createOrUpdatePost(makePost())).rejects.toThrow(
            '저장에 실패했습니다. 다시 시도해 주세요.'
        );
    });

    it('Action Note 삭제는 DELETE 요청으로 처리한다', async () => {
        const fetchMock = mockFetch(new Response(null, { status: 204 }));
        const api = await importFreshApi();

        await expect(api.deletePost(createdPost.id)).resolves.toBeUndefined();

        expect(fetchMock).toHaveBeenCalledWith(`/api/posts/${createdPost.id}`, {
            method: 'DELETE',
        });
    });

    it('Action Note 삭제 실패를 사용자 메시지용 Error로 변환한다', async () => {
        mockFetch(jsonResponse({ error: 'server error' }, 500));
        const api = await importFreshApi();

        await expect(api.deletePost(createdPost.id)).rejects.toThrow(
            '삭제에 실패했습니다. 다시 시도해 주세요.'
        );
    });
});
