'use client';
// 목록 상단 Scope 1/2/3 설명 범례
// SCOPE_COLORS CSS 변수를 직접 참조 — 색상 변경 시 차트 바와 자동 동기화

import { SCOPE_COLORS, SCOPE_DESCRIPTIONS, SCOPE_LABELS } from '@/constants/ghg-scope';
import type { LucideIcon } from 'lucide-react';
import { Flame, Globe, Zap } from 'lucide-react';

// Scope별 대표 아이콘 — 직접 연소 / 구매 전기·열 / 공급망·물류를 직관적으로 표현
const SCOPE_ICONS: Record<1 | 2 | 3, LucideIcon> = {
    1: Flame,
    2: Zap,
    3: Globe,
};

export function ScopeLegend() {
    return (
        <div className="bg-muted/40 flex flex-wrap gap-3 rounded-lg border px-4 py-3">
            {([1, 2, 3] as const).map((scope) => {
                const Icon = SCOPE_ICONS[scope];
                const color = SCOPE_COLORS[scope];
                return (
                    <div key={scope} className="flex items-center gap-2 text-sm">
                        {/* 반투명 배경 + 아이콘 레이어 분리로 아이콘 불투명도 보존 */}
                        <span className="relative flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-md">
                            <span
                                className="absolute inset-0 opacity-20"
                                style={{ backgroundColor: color }}
                            />
                            <Icon className="relative size-4" style={{ color }} />
                        </span>
                        <span>
                            <span className="font-semibold" style={{ color }}>
                                {SCOPE_LABELS[scope]}
                            </span>
                            <span className="text-muted-foreground ml-1.5">
                                {SCOPE_DESCRIPTIONS[scope]}
                            </span>
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
