'use client';

// 배출원 랭킹 차트 — 전체: 수평 바 / Scope별: 도넛 3개 나란히

import { CardHeading } from '@/components/shared/card-heading';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CHART_AXIS_STYLE, CHART_TOOLTIP_STYLE } from '@/constants/chart';
import {
    SCOPE_COLORS,
    SCOPE_DESCRIPTIONS,
    SCOPE_LABELS,
    SOURCE_LABELS,
    type ScopeSourceColorMap,
} from '@/constants/ghg-scope';
import { formatEmissions, formatKilo } from '@/lib/format';
import type { SourceItem } from '@/hooks/sources/useSourceMetrics';
import { Bar, BarChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useMemo, useState } from 'react';

type Props = {
    allSources: SourceItem[];
    activeSourceId: string | null;
    sourceColorMap: ScopeSourceColorMap;
    onSourceSelectAction: (source: string) => void;
    year: number;
};

// Scope별 도넛 하나 렌더링
function ScopeDonut({
    scope,
    sources,
    activeSourceId,
    sourceColorMap,
    onSourceSelectAction,
}: {
    scope: 1 | 2 | 3;
    sources: SourceItem[];
    activeSourceId: string | null;
    sourceColorMap: ScopeSourceColorMap;
    onSourceSelectAction: (source: string) => void;
}) {
    const total = sources.reduce((sum, s) => sum + s.total, 0);
    // fillOpacity를 데이터에 포함 — Recharts Pie가 데이터에서 직접 읽음 (Cell 불필요)
    const data = sources.map((s) => ({
        name: SOURCE_LABELS[s.source] ?? s.source,
        source: s.source,
        value: s.total,
        fill: sourceColorMap[s.source] ?? SCOPE_COLORS[scope],
        fillOpacity: !activeSourceId || activeSourceId === s.source ? 1 : 0.35,
    }));

    if (sources.length === 0) return null;

    return (
        <div className="flex flex-col items-center gap-2">
            {/* Scope 제목 */}
            <div className="flex items-center gap-1.5">
                <span
                    className="size-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: SCOPE_COLORS[scope] }}
                />
                <span className="text-sm font-semibold">{SCOPE_LABELS[scope]}</span>
                <span className="text-muted-foreground text-xs">{SCOPE_DESCRIPTIONS[scope]}</span>
            </div>

            {/* 도넛 */}
            <PieChart width={160} height={160}>
                <Pie
                    data={data}
                    cx={80}
                    cy={80}
                    innerRadius={46}
                    outerRadius={72}
                    paddingAngle={2}
                    dataKey="value"
                    cursor="pointer"
                    onClick={(d: unknown) => {
                        const source = (d as { source?: string })?.source;
                        if (typeof source === 'string') onSourceSelectAction(source);
                    }}
                />
                <Tooltip
                    formatter={(value) => [
                        `${total > 0 ? (((value as number) / total) * 100).toFixed(1) : 0}% · ${formatEmissions(value as number)} tCO₂e`,
                        '배출량',
                    ]}
                    contentStyle={CHART_TOOLTIP_STYLE}
                />
            </PieChart>

            {/* 2열 컴팩트 범례 — 이름 + % */}
            <div className="grid w-full grid-cols-2 gap-x-3 gap-y-1">
                {data.map((d) => {
                    const pct = total > 0 ? ((d.value / total) * 100).toFixed(0) : '0';
                    return (
                        <button
                            key={d.source}
                            onClick={() => onSourceSelectAction(d.source)}
                            className="hover:bg-accent flex items-center gap-1.5 rounded px-1 py-0.5 text-left transition-colors"
                        >
                            <span
                                className="size-2 shrink-0 rounded-sm"
                                style={{ backgroundColor: d.fill }}
                            />
                            <span className="flex-1 truncate text-xs">{d.name}</span>
                            <span className="text-muted-foreground shrink-0 text-xs">{pct}%</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// 배출원 랭킹 차트 렌더링
export function SourceRankingChart({
    allSources,
    activeSourceId,
    sourceColorMap,
    onSourceSelectAction,
    year,
}: Props) {
    const [viewMode, setViewMode] = useState<'all' | 'scope'>('all');

    const barData = useMemo(() => {
        // Scope별 shade 기준 전체 랭킹 색상 동기화
        return allSources.map((s) => ({
            ...s,
            label: SOURCE_LABELS[s.source] ?? s.source,
            fill: sourceColorMap[s.source] ?? SCOPE_COLORS[s.scope],
        }));
    }, [allSources, sourceColorMap]);
    const sourcesByScope = useMemo(
        () => ({
            1: allSources.filter((s) => s.scope === 1),
            2: allSources.filter((s) => s.scope === 2),
            3: allSources.filter((s) => s.scope === 3),
        }),
        [allSources]
    );
    const barHeight = Math.max(160, barData.length * 44);

    return (
        <Card>
            <CardHeading
                title="배출원 랭킹"
                description={`${year}년 배출원별 총 배출량 (tCO₂e)`}
                action={
                    <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'all' | 'scope')}>
                        <TabsList>
                            <TabsTrigger value="all">전체</TabsTrigger>
                            <TabsTrigger value="scope">Scope별</TabsTrigger>
                        </TabsList>
                    </Tabs>
                }
            />
            <CardContent>
                {viewMode === 'all' ? (
                    /* 전체 탭 — 수평 바 차트 */
                    <>
                        <ResponsiveContainer width="100%" height={barHeight}>
                            <BarChart
                                data={barData}
                                layout="vertical"
                                margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                            >
                                <XAxis
                                    type="number"
                                    tick={CHART_AXIS_STYLE}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={formatKilo}
                                />
                                <YAxis
                                    type="category"
                                    dataKey="label"
                                    width={68}
                                    tick={CHART_AXIS_STYLE}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    labelFormatter={(label) => label}
                                    labelStyle={{
                                        fontWeight: 600,
                                        color: 'var(--foreground)',
                                        marginBottom: 4,
                                    }}
                                    formatter={(value) => [
                                        typeof value === 'number'
                                            ? `${formatEmissions(value)} tCO₂e`
                                            : '-',
                                        '배출량',
                                    ]}
                                    contentStyle={CHART_TOOLTIP_STYLE}
                                />
                                <Bar
                                    dataKey="total"
                                    cursor="pointer"
                                    onClick={(d: unknown) => {
                                        const source = (d as { source?: string })?.source;
                                        if (typeof source === 'string')
                                            onSourceSelectAction(source);
                                    }}
                                    shape={(props: unknown) => {
                                        const { x, y, width, height, index } = props as {
                                            x: number;
                                            y: number;
                                            width: number;
                                            height: number;
                                            index: number;
                                        };
                                        const entry = barData[index];
                                        const isActive =
                                            !activeSourceId || activeSourceId === entry?.source;
                                        return (
                                            <rect
                                                x={x}
                                                y={y}
                                                width={Math.max(0, width)}
                                                height={height}
                                                fill={entry?.fill ?? 'var(--muted)'}
                                                fillOpacity={isActive ? 1 : 0.35}
                                                rx={4}
                                            />
                                        );
                                    }}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                        <p className="text-muted-foreground mt-2 text-xs">
                            막대를 클릭하면 상세 분석을 확인합니다.
                        </p>
                    </>
                ) : (
                    /* Scope별 탭 — S1 / S2 / S3 도넛 3개 나란히 */
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                        {([1, 2, 3] as const).map((scope) => (
                            <ScopeDonut
                                key={scope}
                                scope={scope}
                                sources={sourcesByScope[scope]}
                                activeSourceId={activeSourceId}
                                sourceColorMap={sourceColorMap}
                                onSourceSelectAction={onSourceSelectAction}
                            />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
