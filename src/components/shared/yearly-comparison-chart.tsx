'use client';

// 연도별 총 배출량 비교 바 차트 — 선택된 연도 강조 표시

import { CardHeading } from '@/components/shared/card-heading';
import { Card, CardContent } from '@/components/ui/card';
import { CHART_AXIS_STYLE, CHART_TOOLTIP_STYLE } from '@/constants/chart';
import type { AnnualTotal } from '@/lib/emissions';
import { formatEmissions, formatKilo } from '@/lib/format';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type Props = {
    data: AnnualTotal[];
    selectedYear: number;
    title?: string;
    description?: string;
    helpText?: string;
};

// 연도별 배출량 바 차트 렌더링 — 현재 선택 연도 색상 강조
export function YearlyComparisonChart({
    data,
    selectedYear,
    title = '연도별 총 배출량',
    description = '연도별 누적 온실가스 배출량 비교 (tCO₂e)',
    helpText,
}: Props) {
    // 선택된 연도는 강조 색상, 나머지는 muted 처리
    const coloredData = data.map((d) => ({
        ...d,
        fill: d.year === selectedYear ? 'var(--chart-1)' : 'var(--muted-foreground)',
        fillOpacity: d.year === selectedYear ? 1 : 0.35,
    }));

    return (
        <Card>
            <CardHeading title={title} tooltip={helpText} description={description} />
            <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={coloredData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                        <XAxis
                            dataKey="year"
                            tick={CHART_AXIS_STYLE}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={CHART_AXIS_STYLE}
                            axisLine={false}
                            tickLine={false}
                            width={44}
                            tickFormatter={(v) => formatKilo(v, 0)}
                        />
                        <Tooltip
                            formatter={(value) => [
                                typeof value === 'number' ? `${formatEmissions(value)} tCO₂e` : '-',
                                '총 배출량',
                            ]}
                            labelFormatter={(label) => `${label}년`}
                            contentStyle={CHART_TOOLTIP_STYLE}
                        />
                        <Bar dataKey="total" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
