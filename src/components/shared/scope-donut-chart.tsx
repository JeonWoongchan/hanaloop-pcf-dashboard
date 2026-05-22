'use client';

// Scope별 배출 구성 반원 도넛 차트 — 범례 없이 세그먼트 내 S1/S2/S3 라벨, 호버 시 비율 툴팁

import { SCOPE_COLORS } from '@/constants/ghg-scope';
import { Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { ScopeBarItem } from './scope-stacked-bar';

type ChartDatum = { scope: 1 | 2 | 3; pct: number; value: number; fill: string };

// Recharts PieLabelRenderProps 호환 — 선택적 필드로 정의
interface PieLabelProps {
    cx?: number;
    cy?: number;
    midAngle?: number;
    innerRadius?: number;
    outerRadius?: number;
    payload?: ChartDatum;
}

const RADIAN = Math.PI / 180;

// 세그먼트 중앙에 S1/S2/S3 텍스트 렌더링
function renderLabel({ cx, cy, midAngle, innerRadius, outerRadius, payload }: PieLabelProps) {
    if (
        cx == null ||
        cy == null ||
        midAngle == null ||
        innerRadius == null ||
        outerRadius == null ||
        !payload
    )
        return null;
    if (payload.pct < 8) return null;
    const r = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + r * Math.cos(-midAngle * RADIAN);
    const y = cy + r * Math.sin(-midAngle * RADIAN);
    return (
        <text
            x={x}
            y={y}
            fill="white"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={10}
            fontWeight={700}
        >
            S{payload.scope}
        </text>
    );
}

// 호버 툴팁 — S{scope} {pct}% 표시
interface TooltipState {
    active?: boolean;
    payload?: { payload: ChartDatum }[];
}

function CustomTooltip({ active, payload }: TooltipState) {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
        <div className="border-border bg-card rounded-sm border px-2 py-1 text-xs shadow-sm">
            <span className="font-semibold" style={{ color: SCOPE_COLORS[d.scope] }}>
                S{d.scope}
            </span>{' '}
            {Math.round(d.pct)}%
        </div>
    );
}

type Props = {
    scopes: ScopeBarItem[];
};

export function ScopeDonutChart({ scopes }: Props) {
    // pct 0 세그먼트 제외 — Recharts Pie는 0값 세그먼트에서 SVG 렌더링 오류 유발
    const data: ChartDatum[] = scopes
        .filter((s) => s.pct > 0)
        .map((s) => ({ scope: s.scope, pct: s.pct, value: s.pct, fill: SCOPE_COLORS[s.scope] }));

    if (data.length === 0) {
        return (
            <div className="flex h-13 items-center justify-center">
                <span className="text-muted-foreground text-xs">배출 데이터 없음</span>
            </div>
        );
    }

    return (
        <div className="flex cursor-pointer items-center justify-center gap-2">
            {/* 반원 도넛 차트 */}
            <ResponsiveContainer width="50%" height={70}>
                <PieChart margin={{ top: 0, right: 8, bottom: 0, left: 8 }}>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="100%"
                        startAngle={180}
                        endAngle={0}
                        innerRadius={22}
                        outerRadius={60}
                        dataKey="value"
                        labelLine={false}
                        label={renderLabel}
                        stroke="none"
                    />
                    {/* isAnimationActive=false — 툴팁이 왼쪽에서 날아오는 현상 제거 */}
                    <Tooltip isAnimationActive={false} content={<CustomTooltip />} />
                </PieChart>
            </ResponsiveContainer>
            <div className="flex shrink-0 flex-col gap-1">
                {scopes.map(({ scope, pct }) => (
                    <div key={scope} className="flex items-center gap-1 text-xs">
                        <span className="font-semibold" style={{ color: SCOPE_COLORS[scope] }}>
                            S{scope}
                        </span>
                        <span className="text-muted-foreground">{Math.round(pct)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
