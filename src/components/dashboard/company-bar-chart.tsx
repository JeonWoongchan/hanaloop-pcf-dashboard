'use client';

import { CardHeading } from '@/components/shared/card-heading';
import { EmptyState } from '@/components/shared/empty-state';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CHART_AXIS_STYLE, CHART_COLORS, CHART_TOOLTIP_STYLE } from '@/constants/chart';
import { ROUTES } from '@/constants/navigation';
import type { CompanyPcfTotal, CompanyTotal } from '@/lib/emissions';
import {
    formatCompanyName,
    formatEmissions,
    formatKilo,
    formatPcfEmissions,
    GHG_EMISSIONS_UNIT,
    PCF_EMISSIONS_UNIT,
} from '@/lib/format';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const TOP_N = 10;
const YAXIS_WIDTH = 148;
const YAXIS_MAX_LEN = 15;

type ChartMode = 'pcf' | 'emissions';

type Props = {
    emissionsData: CompanyTotal[];
    pcfData: CompanyPcfTotal[];
    year: number;
};

const MODE_CONFIG = {
    pcf: {
        title: `연간 PCF 산정값 상위 ${TOP_N}개 회사`,
        description: (year: number) =>
            `${year}년 원본 활동 데이터 기준 합산값 (${PCF_EMISSIONS_UNIT})`,
        tooltip:
            '선택한 연도에 업로드된 원본 활동 데이터 기준 PCF 산정 총량입니다. 회사 규모나 생산량을 보정한 제품 단위 효율 비교는 아닙니다.',
        valueLabel: '연간 PCF 산정값',
        unit: PCF_EMISSIONS_UNIT,
        formatValue: formatPcfEmissions,
        emptyMessage: (year: number) => `${year}년 PCF 활동 데이터가 없습니다.`,
    },
    emissions: {
        title: `연간 배출량 상위 ${TOP_N}개 회사`,
        description: (year: number) =>
            `${year}년 누적 온실가스 배출량 기준 (${GHG_EMISSIONS_UNIT})`,
        tooltip:
            '연간 누적 배출량 기준 상위 10개 회사를 비교합니다. 막대를 클릭하면 해당 회사 상세 페이지로 이동합니다.',
        valueLabel: '연간 총 배출량',
        unit: GHG_EMISSIONS_UNIT,
        formatValue: formatEmissions,
        emptyMessage: (year: number) => `${year}년 배출량 데이터가 없습니다.`,
    },
} satisfies Record<
    ChartMode,
    {
        title: string;
        description: (year: number) => string;
        tooltip: string;
        valueLabel: string;
        unit: string;
        formatValue: (value: number) => string;
        emptyMessage: (year: number) => string;
    }
>;

export function CompanyBarChart({ emissionsData, pcfData, year }: Props) {
    const router = useRouter();
    const [mode, setMode] = useState<ChartMode>('pcf');
    const config = MODE_CONFIG[mode];
    const data = (mode === 'pcf' ? pcfData : emissionsData)
        .filter((entry) => entry.total > 0)
        .slice(0, TOP_N)
        .map((entry, i) => ({
            ...entry,
            fill: CHART_COLORS[i % CHART_COLORS.length],
        }));

    return (
        <Tabs value={mode} onValueChange={(value) => setMode(value as ChartMode)}>
            <Card>
                <CardHeading
                    title={config.title}
                    tooltip={config.tooltip}
                    description={config.description(year)}
                    action={
                        <TabsList>
                            <TabsTrigger value="pcf">PCF</TabsTrigger>
                            <TabsTrigger value="emissions">배출량</TabsTrigger>
                        </TabsList>
                    }
                />
                <CardContent>
                    {data.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart
                                data={data}
                                layout="vertical"
                                margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
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
                                    width={YAXIS_WIDTH}
                                    tick={CHART_AXIS_STYLE}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(name) => formatCompanyName(name, YAXIS_MAX_LEN)}
                                />
                                <Tooltip
                                    labelFormatter={(name) => name}
                                    labelStyle={{
                                        fontWeight: 600,
                                        color: 'var(--foreground)',
                                        marginBottom: 4,
                                    }}
                                    formatter={(value, _name, item) => {
                                        const color = (item as { payload?: { fill?: string } })
                                            .payload?.fill;
                                        const formatted =
                                            typeof value === 'number'
                                                ? `${config.formatValue(value)} ${config.unit}`
                                                : '-';

                                        return [
                                            <span key="v" style={{ color }}>
                                                {formatted}
                                            </span>,
                                            <span key="n" style={{ color }}>
                                                {config.valueLabel}
                                            </span>,
                                        ];
                                    }}
                                    contentStyle={CHART_TOOLTIP_STYLE}
                                />
                                <Bar
                                    dataKey="total"
                                    radius={[0, 4, 4, 0]}
                                    cursor="pointer"
                                    onClick={(entry) => {
                                        if (typeof entry?.id === 'string') {
                                            router.push(ROUTES.companyDetail(entry.id));
                                        }
                                    }}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyState message={config.emptyMessage(year)} />
                    )}
                </CardContent>
                <CardFooter className="border-t pt-4">
                    <Link
                        href={ROUTES.companies}
                        className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm transition-colors"
                    >
                        전체 회사 목록 보기
                        <ArrowRight className="size-4" />
                    </Link>
                </CardFooter>
            </Card>
        </Tabs>
    );
}
