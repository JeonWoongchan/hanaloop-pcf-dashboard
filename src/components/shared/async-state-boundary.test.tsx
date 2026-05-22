import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { AsyncStateBoundary } from './async-state-boundary';

describe('AsyncStateBoundary', () => {
    it('로딩 상태가 가장 먼저 렌더링된다', () => {
        const html = renderToStaticMarkup(
            <AsyncStateBoundary
                isLoading
                error={new Error('실패')}
                isEmpty
                loadingFallback={<div>로딩 중</div>}
                onRetry={vi.fn()}
            >
                <div>본문</div>
            </AsyncStateBoundary>
        );

        expect(html).toContain('로딩 중');
        expect(html).not.toContain('실패');
        expect(html).not.toContain('본문');
    });

    it('에러 상태에서는 재시도 가능한 에러 안내를 렌더링한다', () => {
        const html = renderToStaticMarkup(
            <AsyncStateBoundary
                isLoading={false}
                error={new Error('실패')}
                loadingFallback={<div>로딩 중</div>}
                errorMessage="불러오지 못했습니다."
                onRetry={vi.fn()}
            >
                <div>본문</div>
            </AsyncStateBoundary>
        );

        expect(html).toContain('불러오지 못했습니다.');
        expect(html).toContain('다시 시도');
    });

    it('재시도 동작이 없는 에러 상태에서는 버튼 없이 안내만 렌더링한다', () => {
        const html = renderToStaticMarkup(
            <AsyncStateBoundary
                isLoading={false}
                error={new Error('실패')}
                loadingFallback={<div>로딩 중</div>}
                errorMessage="일시적으로 불러올 수 없습니다."
            >
                <div>본문</div>
            </AsyncStateBoundary>
        );

        expect(html).toContain('일시적으로 불러올 수 없습니다.');
        expect(html).not.toContain('다시 시도');
    });

    it('빈 상태와 성공 상태를 구분한다', () => {
        const emptyHtml = renderToStaticMarkup(
            <AsyncStateBoundary
                isLoading={false}
                isEmpty
                loadingFallback={<div>로딩 중</div>}
                emptyMessage="결과가 없습니다."
            >
                <div>본문</div>
            </AsyncStateBoundary>
        );
        const successHtml = renderToStaticMarkup(
            <AsyncStateBoundary isLoading={false} loadingFallback={<div>로딩 중</div>}>
                <div>본문</div>
            </AsyncStateBoundary>
        );

        expect(emptyHtml).toContain('결과가 없습니다.');
        expect(successHtml).toContain('본문');
    });
});
