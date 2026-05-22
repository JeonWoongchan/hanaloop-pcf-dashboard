'use client';

// 회사 월별 Scope 1/2/3 스택 에어리어 차트 렌더링

import { CardHeading } from '@/components/shared/card-heading';
import { Card, CardContent } from '@/components/ui/card';
import { CHART_AXIS_STYLE, CHART_TOOLTIP_STYLE } from '@/constants/chart';
import { SCOPE_COLORS, SCOPE_LABELS } from '@/constants/ghg-scope';
import { formatMonthShort, formatTooltipValue, formatYearMonth } from '@/lib/format';
import {
    Area,
    AreaChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

type Props = {
    data: Record<string, number | string>[];
    year: number;
};

// 월별 Scope 구성 스택 에어리어 차트 렌더링
export function CompanyMonthlyChart({ data, year }: Props) {
    return (
        <Card>
            <CardHeading
                title="월별 배출량 추이"
                tooltip="Scope 1·2·3을 구분해 월별 배출량 변화를 누적 에어리어 차트로 표시합니다. 특정 영역에 마우스를 올리면 해당 월의 Scope별 상세 수치를 확인할 수 있습니다."
                description={`Scope 구성 변화 · ${year}년 월별 (tCO₂e)`}
            />
            <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis
                            dataKey="month"
                            tickFormatter={formatMonthShort}
                            tick={CHART_AXIS_STYLE}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={CHART_AXIS_STYLE}
                            axisLine={false}
                            tickLine={false}
                            width={44}
                        />
                        <Tooltip
                            labelFormatter={(label) =>
                                typeof label === 'string' ? formatYearMonth(label) : ''
                            }
                            formatter={formatTooltipValue}
                            contentStyle={CHART_TOOLTIP_STYLE}
                        />
                        <Legend
                            wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                            formatter={(v) => (
                                <span style={{ color: 'var(--foreground)' }}>{v}</span>
                            )}
                        />
                        {/* Scope 1 → 2 → 3 순서로 쌓아 합산이 위로 갈수록 넓어지도록 */}
                        {([1, 2, 3] as const).map((scope) => (
                            <Area
                                key={scope}
                                type="monotone"
                                dataKey={SCOPE_LABELS[scope]}
                                stackId="scope"
                                fill={SCOPE_COLORS[scope]}
                                stroke={SCOPE_COLORS[scope]}
                                fillOpacity={0.8}
                            />
                        ))}
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
