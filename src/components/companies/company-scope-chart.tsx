'use client';

// 회사 GHG Scope 1/2/3 연간 배출량 비중 차트 렌더링

import { CardHeading } from '@/components/shared/card-heading';
import { Card, CardContent } from '@/components/ui/card';
import { CHART_AXIS_STYLE, CHART_TOOLTIP_STYLE } from '@/constants/chart';
import { SCOPE_COLORS, SCOPE_DESCRIPTIONS, SCOPE_LABELS } from '@/constants/ghg-scope';
import { formatEmissions } from '@/lib/format';
import type { ScopeBreakdownItem } from '@/lib/emissions';
import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type Props = {
    scopes: ScopeBreakdownItem[];
    totalEmissions: number;
};

type ScopeChartData = {
    scope: string;
    total: number;
    pct: number;
    fill: string;
};

// Scope 1/2/3 연간 배출량 수평 바 차트 렌더링
export function CompanyScopeChart({ scopes, totalEmissions }: Props) {
    const data: ScopeChartData[] = scopes
        .filter(({ pct }) => pct > 0)
        .map(({ scope, pct }) => ({
            scope: SCOPE_LABELS[scope],
            total: Math.round((pct / 100) * totalEmissions),
            pct,
            fill: SCOPE_COLORS[scope],
        }));

    return (
        <Card>
            <CardHeading
                title="Scope 구분 배출량"
                tooltip={
                    'GHG Protocol 국제 기준에 따라 배출량을 3가지로 구분합니다.\n\nScope 1 (직접): 직접 연소하는 연료(경유·휘발유·천연가스 등)\nScope 2 (간접): 구매한 전기·열·증기\nScope 3 (가치사슬): 물류·출장·폐기물 등 공급망 전반\n\n막대 오른쪽 비율(%)로 구성 비중을 확인할 수 있습니다.'
                }
                description="GHG Protocol 기준 직접·간접 배출 구분 (tCO₂e)"
            />
            <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                    <BarChart
                        data={data}
                        layout="vertical"
                        margin={{ top: 4, right: 60, left: 8, bottom: 4 }}
                    >
                        <XAxis type="number" hide />
                        <YAxis
                            type="category"
                            dataKey="scope"
                            width={60}
                            tick={CHART_AXIS_STYLE}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            formatter={(value) => [
                                typeof value === 'number' ? `${formatEmissions(value)} tCO₂e` : '-',
                                '배출량',
                            ]}
                            labelFormatter={(label) => {
                                const scope = Object.entries(SCOPE_LABELS).find(
                                    ([, v]) => v === label
                                )?.[0];
                                return scope
                                    ? SCOPE_DESCRIPTIONS[Number(scope) as 1 | 2 | 3]
                                    : label;
                            }}
                            contentStyle={CHART_TOOLTIP_STYLE}
                        />
                        <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                            <LabelList
                                dataKey="pct"
                                position="right"
                                formatter={(v: unknown) =>
                                    typeof v === 'number' ? `${v.toFixed(0)}%` : ''
                                }
                                style={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
