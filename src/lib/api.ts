import type { Company, Country, Post } from '@/types';
import { companies as seedCompanies, countries as seedCountries, posts as seedPosts } from './data';

// 모듈 스코프 in-memory 상태 — 서버 재시작 전까지 유지
let _countries: Country[] = [...seedCountries];
let _companies: Company[] = [...seedCompanies];
let _posts: Post[] = [...seedPosts];

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
// 200~800ms 사이의 랜덤 지연
const jitter = () => 200 + Math.random() * 600;
// 쓰기 작업 15% 확률 실패 시뮬레이션
const maybeFail = () => Math.random() < 0.15;

export async function fetchCountries(): Promise<Country[]> {
    await delay(jitter());
    return _countries;
}

export async function fetchCompanies(): Promise<Company[]> {
    await delay(jitter());
    return _companies;
}

export async function fetchPosts(): Promise<Post[]> {
    await delay(jitter());
    return _posts;
}

export async function createOrUpdatePost(
    p: Omit<Post, 'id'> & { id?: string }
): Promise<Post> {
    await delay(jitter());
    if (maybeFail()) throw new Error('저장에 실패했습니다. 다시 시도해 주세요.');

    if (p.id) {
        _posts = _posts.map((x) => (x.id === p.id ? (p as Post) : x));
        return p as Post;
    }

    const created: Post = { ...p, id: crypto.randomUUID() };
    _posts = [..._posts, created];
    return created;
}

export async function deletePost(id: string): Promise<void> {
    await delay(jitter());
    if (maybeFail()) throw new Error('삭제에 실패했습니다. 다시 시도해 주세요.');
    _posts = _posts.filter((x) => x.id !== id);
}
