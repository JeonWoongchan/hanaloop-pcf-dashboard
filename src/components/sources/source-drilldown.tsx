'use client';

// 선택 배출원 드릴다운 — 회사별 분포 + 월별 추이

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CHART_AXIS_STYLE, CHART_TOOLTIP_STYLE } from '@/constants/chart';
import { SCOPE_COLORS, SOURCE_LABELS } from '@/constants/ghg-scope';
import { ROUTES } from '@/constants/navigation';
import { formatCompanyName, formatEmissions, formatKilo, formatMonthShort, formatTooltipValue, formatYearMonth } from '@/lib/format';
import type { CompanyTotal, MonthlyTotal } from '@/lib/emissions';
import { useRouter } from 'next/navigation';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

type Props = {
    sourceId: string;
    scope: 1 | 2 | 3;
    companyBreakdown: CompanyTotal[];
    monthlyTrend: MonthlyTotal[];
    year: number;
};

// 선택 배출원 상세 분석 카드 렌더링
export function SourceDrilldown({ sourceId, scope, companyBreakdown, monthlyTrend, year }: Props) {
    const router = useRouter();
    const label = SOURCE_LABELS[sourceId] ?? sourceId;
    const color = SCOPE_COLORS[scope];
    const chartHeight = Math.max(160, companyBreakdown.length * 40);

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    <span style={{ color }}>{label}</span> 상세 분석
                </CardTitle>
                <CardDescription>{year}년 · 회사별 배출량 및 월별 추이</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* 회사별 배출량 */}
                    <div>
                        <p className="mb-3 text-sm font-medium">회사별 배출량</p>
                        {companyBreakdown.length === 0 ? (
                            <p className="text-sm text-muted-foreground">해당 배출원 데이터가 없습니다.</p>
                        ) : (
                            <ResponsiveContainer width="100%" height={chartHeight}>
                                <BarChart
                                    data={companyBreakdown}
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
                                        dataKey="name"
                                        width={110}
                                        tick={CHART_AXIS_STYLE}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(name) => formatCompanyName(name, 14)}
                                    />
                                    <Tooltip
                                        labelFormatter={(name) => name}
                                        labelStyle={{ fontWeight: 600, color: 'var(--foreground)', marginBottom: 4 }}
                                        formatter={(value) => [
                                            typeof value === 'number' ? `${formatEmissions(value)} tCO₂e` : '-',
                                            label,
                                        ]}
                                        contentStyle={CHART_TOOLTIP_STYLE}
                                    />
                                    <Bar
                                        dataKey="total"
                                        fill={color}
                                        radius={[0, 4, 4, 0]}
                                        cursor="pointer"
                                        onClick={(d) => {
                                            if (typeof d?.id === 'string') {
                                                router.push(ROUTES.companyDetail(d.id));
                                            }
                                        }}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* 월별 추이 */}
                    <div>
                        <p className="mb-3 text-sm font-medium">월별 추이</p>
                        <ResponsiveContainer width="100%" height={Math.max(160, chartHeight)}>
                            <LineChart
                                data={monthlyTrend}
                                margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis
                                    dataKey="month"
                                    tickFormatter={formatMonthShort}
                                    tick={CHART_AXIS_STYLE}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} width={44} />
                                <Tooltip
                                    labelFormatter={(label) =>
                                        typeof label === 'string' ? formatYearMonth(label) : ''
                                    }
                                    formatter={formatTooltipValue}
                                    contentStyle={CHART_TOOLTIP_STYLE}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="total"
                                    name={label}
                                    stroke={color}
                                    strokeWidth={2.5}
                                    dot={false}
                                    activeDot={{ r: 4 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
