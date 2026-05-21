'use client';

// 배출원 랭킹 수평 바 차트 — Scope 탭 필터 + 클릭 선택

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CHART_AXIS_STYLE, CHART_TOOLTIP_STYLE } from '@/constants/chart';
import { SCOPE_COLORS, SOURCE_LABELS } from '@/constants/ghg-scope';
import { formatEmissions, formatKilo } from '@/lib/format';
import type { SourceItem } from '@/hooks/sources/useSourceMetrics';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type Props = {
    sources: SourceItem[];
    activeSourceId: string | null;
    scopeFilter: string;
    onScopeChangeAction: (scope: string) => void;
    onSourceSelectAction: (source: string) => void;
    year: number;
};

const SCOPE_TABS = [
    { value: 'all', label: '전체' },
    { value: '1', label: 'Scope 1' },
    { value: '2', label: 'Scope 2' },
    { value: '3', label: 'Scope 3' },
] as const;

// 배출원 랭킹 차트 렌더링
export function SourceRankingChart({
    sources,
    activeSourceId,
    scopeFilter,
    onScopeChangeAction,
    onSourceSelectAction,
    year,
}: Props) {
    const data = sources.map((s) => ({
        ...s,
        label: SOURCE_LABELS[s.source] ?? s.source,
        fill: SCOPE_COLORS[s.scope],
    }));

    const chartHeight = Math.max(160, data.length * 44);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <CardTitle>배출원 랭킹</CardTitle>
                        <CardDescription>{year}년 배출원별 총 배출량 (tCO₂e)</CardDescription>
                    </div>
                    <Tabs value={scopeFilter} onValueChange={onScopeChangeAction}>
                        <TabsList>
                            {SCOPE_TABS.map((tab) => (
                                <TabsTrigger key={tab.value} value={tab.value}>
                                    {tab.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                </div>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={chartHeight}>
                    <BarChart
                        data={data}
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
                            labelStyle={{ fontWeight: 600, color: 'var(--foreground)', marginBottom: 4 }}
                            formatter={(value) => [
                                typeof value === 'number' ? `${formatEmissions(value)} tCO₂e` : '-',
                                '배출량',
                            ]}
                            contentStyle={CHART_TOOLTIP_STYLE}
                        />
                        {/* Cell 대신 shape prop 사용 — Recharts 4.0 권장 방식 */}
                        <Bar
                            dataKey="total"
                            cursor="pointer"
                            onClick={(d: unknown) => {
                                const source = (d as { source?: string })?.source;
                                if (typeof source === 'string') onSourceSelectAction(source);
                            }}
                            shape={(props: unknown) => {
                                const { x, y, width, height, index } = props as {
                                    x: number; y: number; width: number; height: number; index: number;
                                };
                                const entry = data[index];
                                const isActive = !activeSourceId || activeSourceId === entry?.source;
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
                <p className="mt-2 text-xs text-muted-foreground">막대를 클릭하면 상세 분석을 확인합니다.</p>
            </CardContent>
        </Card>
    );
}
