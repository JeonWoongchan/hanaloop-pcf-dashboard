import type { Company, Country, Post } from '@/types';
async function fetchJson<T>(url: string, errorMessage: string): Promise<T> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(errorMessage);
    return res.json() as Promise<T>;
}

export async function fetchCountries(): Promise<Country[]> {
    return fetchJson<Country[]>('/api/countries', '국가 목록을 불러오지 못했습니다.');
}

export async function fetchCompanies(): Promise<Company[]> {
    return fetchJson<Company[]>('/api/companies', '회사 목록을 불러오지 못했습니다.');
}

// posts는 Route Handler(/api/posts)를 통해 Postgres에서 관리
export async function fetchPosts(): Promise<Post[]> {
    return fetchJson<Post[]>('/api/posts', '게시글을 불러오지 못했습니다.');
}

export async function createOrUpdatePost(p: Omit<Post, 'id'> & { id?: string }): Promise<Post> {
    const url = p.id ? `/api/posts/${p.id}` : '/api/posts';
    const method = p.id ? 'PUT' : 'POST';
    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
    });
    if (!res.ok) throw new Error('저장에 실패했습니다. 다시 시도해 주세요.');
    return res.json() as Promise<Post>;
}

export async function deletePost(id: string): Promise<void> {
    const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('삭제에 실패했습니다. 다시 시도해 주세요.');
}
