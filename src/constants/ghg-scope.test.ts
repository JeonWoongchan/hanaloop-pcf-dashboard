import { describe, expect, it } from 'vitest';
import { SCOPE_MAP, SOURCE_LABELS, getScopeSourceColorMap } from './ghg-scope';

describe('ghg scope constants', () => {
    it('주요 배출원을 Scope 1/2/3 기준으로 분류한다', () => {
        expect(SCOPE_MAP.gasoline).toBe(1);
        expect(SCOPE_MAP.diesel).toBe(1);
        expect(SCOPE_MAP.naturalGas).toBe(1);
        expect(SCOPE_MAP.electricity).toBe(2);
        expect(SCOPE_MAP.heat).toBe(2);
        expect(SCOPE_MAP.shipping).toBe(3);
        expect(SCOPE_MAP.businessTravel).toBe(3);
        expect(SCOPE_MAP.waste).toBe(3);
    });

    it('배출원별 한글 레이블을 제공한다', () => {
        expect(SOURCE_LABELS).toMatchObject({
            naturalGas: '천연가스',
            electricity: '전기',
            businessTravel: '출장',
        });
    });

    it('Scope 내부 순위에 따라 배출원 shade 색상을 배정한다', () => {
        expect(
            getScopeSourceColorMap([
                { source: 'diesel', scope: 1 },
                { source: 'gasoline', scope: 1 },
                { source: 'electricity', scope: 2 },
                { source: 'shipping', scope: 3 },
            ])
        ).toEqual({
            diesel: 'var(--scope-1-shade-1)',
            gasoline: 'var(--scope-1-shade-2)',
            electricity: 'var(--scope-2-shade-1)',
            shipping: 'var(--scope-3-shade-1)',
        });
    });
});
