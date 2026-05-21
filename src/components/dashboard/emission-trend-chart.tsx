'use client';

// 회사별 월간 배출량 추이 라인 차트 렌더링

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CHART_COLORS } from '@/constants/chart';
import type { Company } from '@/types';
import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

type Props = {
    data: Record<string, number | string>[];
    companies: Company[];
};

// "2024-01" → "1월"
const formatAxisMonth = (ym: string) => `${parseInt((ym as string).split('-')[1])}월`;

// "2024-01" → "2024년 1월"
const formatTooltipMonth = (ym: string) => {
    const [year, month] = (ym as string).split('-');
    return `${year}년 ${parseInt(month)}월`;
};

// 회사별 월간 배출량 라인 차트 렌더링
export function EmissionTrendChart({ data, companies }: Props) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>월간 배출량 추이</CardTitle>
                <CardDescription>회사별 2024년 월간 온실가스 배출량 (tCO₂e)</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis
                            dataKey="month"
                            tickFormatter={formatAxisMonth}
                            tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) => `${v}`}
                            width={40}
                        />
                        <Tooltip
                            labelFormatter={(label) =>
                                typeof label === 'string' ? formatTooltipMonth(label) : ''
                            }
                            formatter={(value, name) => [
                                typeof value === 'number'
                                    ? `${value.toLocaleString('ko-KR')} tCO₂e`
                                    : '-',
                                name,
                            ]}
                            contentStyle={{
                                backgroundColor: 'var(--card)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius)',
                                fontSize: 12,
                            }}
                        />
                        <Legend
                            wrapperStyle={{ fontSize: 12, paddingTop: 16 }}
                            formatter={(value) => (
                                <span style={{ color: 'var(--foreground)' }}>{value}</span>
                            )}
                        />
                        {companies.map((company, i) => (
                            <Line
                                key={company.id}
                                type="monotone"
                                dataKey={company.name}
                                stroke={CHART_COLORS[i % CHART_COLORS.length]}
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4 }}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
