'use client';

import { CardHeading } from '@/components/shared/card-heading';
import { Card, CardContent } from '@/components/ui/card';
import { CHART_AXIS_STYLE, CHART_TOOLTIP_STYLE } from '@/constants/chart';
import type { AnnualTotal } from '@/lib/emissions';
import { formatEmissions, formatKilo, GHG_EMISSIONS_UNIT } from '@/lib/format';
import type { ReactNode } from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type Props = {
    data: AnnualTotal[];
    selectedYear: number;
    title?: string;
    description?: string;
    helpText?: string;
    action?: ReactNode;
    valueLabel?: string;
    unit?: string;
    formatValueAction?: (value: number) => string;
};

export function YearlyComparisonChart({
    data,
    selectedYear,
    title = '연도별 총 배출량',
    description = `연도별 누적 온실가스 배출량 비교 (${GHG_EMISSIONS_UNIT})`,
    helpText,
    action,
    valueLabel = '총 배출량',
    unit = GHG_EMISSIONS_UNIT,
    formatValueAction = formatEmissions,
}: Props) {
    const coloredData = data.map((d) => ({
        ...d,
        fill: d.year === selectedYear ? 'var(--chart-1)' : 'var(--muted-foreground)',
        fillOpacity: d.year === selectedYear ? 1 : 0.35,
    }));

    return (
        <Card>
            <CardHeading
                title={title}
                tooltip={helpText}
                description={description}
                action={action}
            />
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
                                typeof value === 'number' ? `${formatValueAction(value)} ${unit}` : '-',
                                valueLabel,
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
