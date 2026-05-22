'use client';

// 배출원별 연간 총 배출량 바 차트 렌더링

import { CardHeading } from '@/components/shared/card-heading';
import { Card, CardContent } from '@/components/ui/card';
import { CHART_AXIS_STYLE, CHART_TOOLTIP_STYLE } from '@/constants/chart';
import { SCOPE_COLORS, SCOPE_LABELS, SOURCE_LABELS } from '@/constants/ghg-scope';
import { formatEmissions, formatCompanyName, formatKilo } from '@/lib/format';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type SourceItem = { source: string; total: number; scope: 1 | 2 | 3 };

type Props = {
    sources: SourceItem[];
    year: number;
};

// 배출원별 연간 총 배출량 수평 바 차트 렌더링
export function CompanySourceChart({ sources, year }: Props) {
    const data = sources.map((s) => ({
        ...s,
        label: SOURCE_LABELS[s.source] ?? s.source,
        fill: SCOPE_COLORS[s.scope],
    }));

    const chartHeight = Math.max(160, data.length * 36);

    return (
        <Card>
            <CardHeading
                title="배출원별 배출량"
                tooltip="연료 유형·활동별로 연간 배출량을 비교합니다. 막대 색상은 Scope 구분을 나타내며, 호버 시 해당 배출원이 속한 Scope를 함께 확인할 수 있습니다."
                description={`배출원 및 Scope 구분 · ${year}년 연간 (tCO₂e)`}
            />
            <CardContent>
                {/* Scope 색상 범례 */}
                <div className="text-muted-foreground mb-3 flex flex-wrap gap-3 text-xs">
                    {([1, 2, 3] as const).map((scope) => (
                        <span key={scope} className="flex items-center gap-1">
                            <span
                                className="inline-block size-2.5 rounded-sm"
                                style={{ backgroundColor: SCOPE_COLORS[scope] }}
                            />
                            {SCOPE_LABELS[scope]}
                        </span>
                    ))}
                </div>
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
                            width={70}
                            tick={CHART_AXIS_STYLE}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) => formatCompanyName(v, 7)}
                        />
                        <Tooltip
                            formatter={(value) => [
                                typeof value === 'number' ? `${formatEmissions(value)} tCO₂e` : '-',
                                '배출량',
                            ]}
                            labelFormatter={(label) => {
                                const item = data.find((d) => d.label === label);
                                return item ? `${label} (${SCOPE_LABELS[item.scope]})` : label;
                            }}
                            contentStyle={CHART_TOOLTIP_STYLE}
                        />
                        <Bar dataKey="total" radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
