'use client';

// 회사별 연간 총 배출량 비교 수평 바 차트 렌더링

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CHART_COLORS } from '@/constants/chart';
import type { CompanyTotal } from '@/lib/emissions';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type Props = {
    data: CompanyTotal[];
};

// 회사명 축 레이블 — 긴 이름 말줄임
const formatCompanyName = (name: string) =>
    name.length > 14 ? `${name.slice(0, 14)}…` : name;

// 회사별 연간 총 배출량 수평 바 차트 렌더링
export function CompanyBarChart({ data }: Props) {
    // Recharts는 데이터 객체에 fill 필드가 있으면 각 바에 자동 적용
    const coloredData = data.map((entry, i) => ({
        ...entry,
        fill: CHART_COLORS[i % CHART_COLORS.length],
    }));

    return (
        <Card>
            <CardHeader>
                <CardTitle>회사별 연간 총 배출량</CardTitle>
                <CardDescription>2024년 누적 온실가스 배출량 비교 (tCO₂e)</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                    <BarChart
                        data={coloredData}
                        layout="vertical"
                        margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                    >
                        <XAxis
                            type="number"
                            tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
                        />
                        <YAxis
                            type="category"
                            dataKey="name"
                            width={120}
                            tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={formatCompanyName}
                        />
                        <Tooltip
                            formatter={(value) => [
                                typeof value === 'number'
                                    ? `${value.toLocaleString('ko-KR')} tCO₂e`
                                    : '-',
                                '연간 총 배출량',
                            ]}
                            contentStyle={{
                                backgroundColor: 'var(--card)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius)',
                                fontSize: 12,
                            }}
                        />
                        <Bar dataKey="total" radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
