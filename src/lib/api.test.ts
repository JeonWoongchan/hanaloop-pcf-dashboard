import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Company, Country, Post } from '@/types';

type ApiModule = typeof import('./api');

const countryFixture: Country = { code: 'KR', name: 'South Korea' };
const companyFixture: Company = {
    id: 'c1',
    name: 'Acme Manufacturing',
    country: 'US',
    emissions: [{ yearMonth: '2024-01', source: 'diesel', emissions: 88 }],
};
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

function mockFetchResponses(...responses: Response[]): ReturnType<typeof vi.fn> {
    const fetchMock = vi.fn<(...args: Parameters<typeof fetch>) => Promise<Response>>();
    for (const response of responses) {
        fetchMock.mockResolvedValueOnce(response);
    }
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

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe('api wrappers', () => {
    it('국가·회사 목록을 Route Handler에서 가져온다', async () => {
        const fetchMock = mockFetchResponses(
            jsonResponse([countryFixture]),
            jsonResponse([companyFixture])
        );
        const api = await importFreshApi();

        const countries = await api.fetchCountries();
        const companies = await api.fetchCompanies();

        expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/countries');
        expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/companies');
        expect(countries).toEqual([countryFixture]);
        expect(companies).toEqual([companyFixture]);
    });

    it('국가 목록 조회 실패를 사용자 메시지용 Error로 변환한다', async () => {
        mockFetch(jsonResponse({ error: 'server error' }, 500));
        const api = await importFreshApi();

        await expect(api.fetchCountries()).rejects.toThrow('국가 목록을 불러오지 못했습니다.');
    });

    it('회사 목록 조회 실패를 사용자 메시지용 Error로 변환한다', async () => {
        mockFetch(jsonResponse({ error: 'server error' }, 500));
        const api = await importFreshApi();

        await expect(api.fetchCompanies()).rejects.toThrow('회사 목록을 불러오지 못했습니다.');
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
        mockFetch(jsonResponse({ error: '저장에 실패했습니다. 의도적인 실패입니다.(15%)' }, 500));
        const api = await importFreshApi();

        await expect(api.createOrUpdatePost(makePost())).rejects.toThrow(
            '저장에 실패했습니다. 의도적인 실패입니다.(15%)'
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
        mockFetch(jsonResponse({ error: '삭제에 실패했습니다.' }, 500));
        const api = await importFreshApi();

        await expect(api.deletePost(createdPost.id)).rejects.toThrow('삭제에 실패했습니다.');
    });
});
