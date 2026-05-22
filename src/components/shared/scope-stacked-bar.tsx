// Scope별 배출 비중 가로 스택 바 + 범례 공통 렌더링

import { SCOPE_COLORS } from '@/constants/ghg-scope';

export type ScopeBarItem = { scope: 1 | 2 | 3; pct: number };

type Props = {
    scopes: ScopeBarItem[];
    // 미채워진 구간을 bg-muted로 표시 — 데이터가 100%를 채우지 않을 때 사용
    showBackground?: boolean;
    isKpiCard?: boolean;
};

export function ScopeStackedBar({ scopes, showBackground = false, isKpiCard = false }: Props) {
    return (
        <div className="space-y-2">
            <div
                className={`flex w-full overflow-hidden ${!isKpiCard ? 'h-2 rounded-full' : 'h-7 rounded-xl'} ${showBackground ? 'bg-muted' : ''}`}
            >
                {scopes.map(({ scope, pct }) => (
                    <div
                        key={scope}
                        style={{ width: `${pct}%`, backgroundColor: SCOPE_COLORS[scope] }}
                    />
                ))}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
                {scopes.map(({ scope, pct }) =>
                    pct > 0 ? (
                        <span
                            key={scope}
                            className="text-muted-foreground flex items-center gap-1 text-xs"
                        >
                            <span
                                className="size-2 shrink-0 rounded-sm"
                                style={{ backgroundColor: SCOPE_COLORS[scope] }}
                            />
                            S{scope} {Math.round(pct)}%
                        </span>
                    ) : null
                )}
            </div>
        </div>
    );
}
