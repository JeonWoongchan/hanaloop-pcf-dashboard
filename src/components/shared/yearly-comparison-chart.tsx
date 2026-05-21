'use client';

// 연도별 총 배출량 비교 바 차트 — 선택된 연도 강조 표시

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { AnnualTotal } from '@/lib/emissions';
import { formatEmissions } from '@/lib/format';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type Props = {
    data: AnnualTotal[];
    selectedYear: number;
    title?: string;
    description?: string;
};

const axisTickStyle = { fontSize: 12, fill: 'var(--muted-foreground)' };

// 연도별 배출량 바 차트 렌더링 — 현재 선택 연도 색상 강조
export function YearlyComparisonChart({
    data,
    selectedYear,
    title = '연도별 총 배출량',
    description = '연도별 누적 온실가스 배출량 비교 (tCO₂e)',
}: Props) {
    // 선택된 연도는 강조 색상, 나머지는 muted 처리
    const coloredData = data.map((d) => ({
        ...d,
        fill: d.year === selectedYear ? 'var(--chart-1)' : 'var(--muted-foreground)',
        fillOpacity: d.year === selectedYear ? 1 : 0.35,
    }));

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={coloredData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                        <XAxis
                            dataKey="year"
                            tick={axisTickStyle}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={axisTickStyle}
                            axisLine={false}
                            tickLine={false}
                            width={44}
                            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                            formatter={(value) => [
                                typeof value === 'number'
                                    ? `${formatEmissions(value)} tCO₂e`
                                    : '-',
                                '총 배출량',
                            ]}
                            labelFormatter={(label) => `${label}년`}
                            contentStyle={{
                                backgroundColor: 'var(--card)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius)',
                                fontSize: 12,
                            }}
                        />
                        <Bar dataKey="total" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
