export const SCOPE_MAP: Record<string, 1 | 2 | 3> = {
    // Scope 1 — 직접 배출 (내부 연소)
    gasoline: 1,
    diesel: 1,
    lpg: 1,
    naturalGas: 1,
    // Scope 2 — 간접 배출 (구매 전기·열)
    electricity: 2,
    heat: 2,
    steam: 2,
    // Scope 3 — 가치사슬 배출 (공급망·운송·원소재)
    shipping: 3,
    businessTravel: 3,
    waste: 3,
    plastic1: 3,
    plastic2: 3,
};

export const SCOPES = [1, 2, 3] as const;

export const SCOPE_LABELS: Record<1 | 2 | 3, string> = {
    1: 'Scope 1',
    2: 'Scope 2',
    3: 'Scope 3',
};

export const SCOPE_DESCRIPTIONS: Record<1 | 2 | 3, string> = {
    1: '직접 배출 (경유·천연가스·휘발유 등)',
    2: '간접 배출 (전기·열·증기 등)',
    3: '가치사슬 배출 (해운·출장·폐기물 등)',
};

// Scope별 차트 색상 — globals.css chart 토큰에서 의미 기반 배정
export const SCOPE_COLORS: Record<1 | 2 | 3, string> = {
    1: 'var(--chart-3)', // amber — 직접 연소
    2: 'var(--chart-2)', // blue  — 전기·열
    3: 'var(--chart-5)', // purple — 공급망·운송
};

// Scope별 배출원 shade 토큰
export const SCOPE_SHADE_COLORS: Record<1 | 2 | 3, string[]> = {
    1: [
        'var(--scope-1-shade-1)',
        'var(--scope-1-shade-2)',
        'var(--scope-1-shade-3)',
        'var(--scope-1-shade-4)',
        'var(--scope-1-shade-5)',
    ],
    2: [
        'var(--scope-2-shade-1)',
        'var(--scope-2-shade-2)',
        'var(--scope-2-shade-3)',
        'var(--scope-2-shade-4)',
        'var(--scope-2-shade-5)',
    ],
    3: [
        'var(--scope-3-shade-1)',
        'var(--scope-3-shade-2)',
        'var(--scope-3-shade-3)',
        'var(--scope-3-shade-4)',
        'var(--scope-3-shade-5)',
    ],
};

const DEFAULT_SCOPE_SHADE_COLORS = [
    'var(--chart-1)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)',
];

export type ScopeSourceColorMap = Record<string, string>;

type ScopeSourceColorItem = {
    source: string;
    scope: 1 | 2 | 3;
};

function getScopeShades(scope: string, count: number): string[] {
    const numericScope = Number(scope);
    const palette =
        numericScope === 1 || numericScope === 2 || numericScope === 3
            ? SCOPE_SHADE_COLORS[numericScope]
            : DEFAULT_SCOPE_SHADE_COLORS;

    // 요청 개수에 맞춘 shade 토큰 반복
    return Array.from({ length: count }, (_, i) => palette[i % palette.length]);
}

export function getScopeSourceColorMap<T extends ScopeSourceColorItem>(
    sources: T[]
): ScopeSourceColorMap {
    const colorMap: ScopeSourceColorMap = {};

    // Scope 내부 순위 기준 배출원 색상 매핑
    for (const scope of [1, 2, 3] as const) {
        const scopeSources = sources.filter((source) => source.scope === scope);
        const shades = getScopeShades(String(scope), scopeSources.length);

        scopeSources.forEach((source, index) => {
            colorMap[source.source] = shades[index] ?? SCOPE_COLORS[scope];
        });
    }

    return colorMap;
}

// 배출원 코드 한글 레이블
export const SOURCE_LABELS: Record<string, string> = {
    gasoline: '휘발유',
    diesel: '경유',
    lpg: 'LPG',
    naturalGas: '천연가스',
    electricity: '전기',
    heat: '열',
    steam: '증기',
    shipping: '해운',
    businessTravel: '출장',
    waste: '폐기물',
    plastic1: '플라스틱 1',
    plastic2: '플라스틱 2',
};
