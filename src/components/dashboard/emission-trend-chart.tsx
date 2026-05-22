'use client';

import { CardHeading } from '@/components/shared/card-heading';
import { EmptyState } from '@/components/shared/empty-state';
import { MultiSelectPopover } from '@/components/shared/multi-select-popover';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CHART_AXIS_STYLE, CHART_COLORS, CHART_TOOLTIP_STYLE } from '@/constants/chart';
import { TOTAL_EMISSIONS_KEY } from '@/lib/emissions';
import {
    formatEmissions,
    formatMonthShort,
    formatPcfEmissions,
    formatYearMonth,
    GHG_EMISSIONS_UNIT,
    PCF_EMISSIONS_UNIT,
} from '@/lib/format';
import type { Company } from '@/types';
import { X } from 'lucide-react';
import { parseAsArrayOf, parseAsString, useQueryState } from 'nuqs';
import { useState } from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    Legend,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

const MAX_COMPARE = 5;
const companyIdsParser = parseAsArrayOf(parseAsString).withDefault([]);

type ChartMode = 'pcf' | 'emissions';
type ChartRow = Record<string, number | string>;

type Props = {
    emissionsData: ChartRow[];
    pcfData: ChartRow[];
    companies: Company[];
    year: number;
};

const MODE_CONFIG = {
    pcf: {
        title: '월간 PCF 추이',
        description: (year: number) =>
            `${year}년 원본 활동 데이터 기준 월별 PCF (${PCF_EMISSIONS_UNIT})`,
        tooltip:
            '업로드된 원본 활동 데이터에서 계산한 월별 PCF 합산값입니다. 회사 비교 추가로 선택한 회사의 PCF 추이를 함께 볼 수 있습니다.',
        totalLabel: '월간 총 PCF',
        unit: PCF_EMISSIONS_UNIT,
        formatValue: formatPcfEmissions,
        emptyMessage: (year: number) => `${year}년 PCF 활동 데이터가 없습니다.`,
    },
    emissions: {
        title: '월간 배출량 추이',
        description: (year: number) => `${year}년 월별 온실가스 배출량 (${GHG_EMISSIONS_UNIT})`,
        tooltip:
            '전체 회사 합산 배출량을 영역 차트로 표시하고, 회사 비교 추가로 선택한 회사를 점선으로 함께 표시합니다.',
        totalLabel: '월간 총 배출량',
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
        totalLabel: string;
        unit: string;
        formatValue: (value: number) => string;
        emptyMessage: (year: number) => string;
    }
>;

function CompanyBadgeList({
    companies,
    onRemove,
}: {
    companies: Company[];
    onRemove: (id: string) => void;
}) {
    return (
        <>
            {companies.map((company, i) => (
                <Badge
                    key={company.id}
                    variant="secondary"
                    className="gap-1 pr-1"
                    style={{
                        borderLeft: `3px solid ${CHART_COLORS[(i + 1) % CHART_COLORS.length]}`,
                    }}
                >
                    {company.name}
                    <button
                        type="button"
                        onClick={() => onRemove(company.id)}
                        className="hover:text-foreground ml-0.5 rounded"
                        aria-label={`${company.name} 비교 제거`}
                    >
                        <X className="size-3" />
                    </button>
                </Badge>
            ))}
        </>
    );
}

export function EmissionTrendChart({ emissionsData, pcfData, companies, year }: Props) {
    const [mode, setMode] = useState<ChartMode>('pcf');
    const [selectedIds, setSelectedIds] = useQueryState('compareCompanies', companyIdsParser);
    const [open, setOpen] = useState(false);

    const config = MODE_CONFIG[mode];
    const data = mode === 'pcf' ? pcfData : emissionsData;
    const selectedCompanies = companies.filter((c) => selectedIds.includes(c.id));
    const isMaxReached = selectedIds.length >= MAX_COMPARE;

    const toggleCompany = (id: string) => {
        if (selectedIds.includes(id)) {
            void setSelectedIds(selectedIds.filter((s) => s !== id));
        } else if (!isMaxReached) {
            void setSelectedIds([...selectedIds, id]);
        }
    };

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
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                        <MultiSelectPopover
                            items={companies.map((c) => ({ id: c.id, label: c.name }))}
                            label={isMaxReached ? `최대 ${MAX_COMPARE}개 선택됨` : '회사 비교 추가'}
                            open={open}
                            onOpenChangeAction={setOpen}
                            isSelectedAction={(id) => selectedIds.includes(id)}
                            isDisabledAction={(id) => !selectedIds.includes(id) && isMaxReached}
                            onToggleAction={toggleCompany}
                            searchPlaceholder="회사 검색..."
                        />
                        <CompanyBadgeList companies={selectedCompanies} onRemove={toggleCompany} />
                    </div>

                    {data.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart
                                data={data}
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
                                <YAxis
                                    tick={CHART_AXIS_STYLE}
                                    axisLine={false}
                                    tickLine={false}
                                    width={44}
                                    domain={[0, (dataMax: number) => Math.round(dataMax * 1.2)]}
                                />
                                <Tooltip
                                    labelFormatter={(label) =>
                                        typeof label === 'string' ? formatYearMonth(label) : ''
                                    }
                                    formatter={(value, name) => {
                                        if (typeof value !== 'number') return ['-', String(name)];
                                        const label =
                                            name === TOTAL_EMISSIONS_KEY
                                                ? config.totalLabel
                                                : String(name);

                                        return [
                                            `${config.formatValue(value)} ${config.unit}`,
                                            label,
                                        ];
                                    }}
                                    contentStyle={CHART_TOOLTIP_STYLE}
                                />
                                <Legend
                                    wrapperStyle={{ fontSize: 12, paddingTop: 16 }}
                                    formatter={(value) => (
                                        <span style={{ color: 'var(--foreground)' }}>
                                            {value === TOTAL_EMISSIONS_KEY
                                                ? config.totalLabel
                                                : value}
                                        </span>
                                    )}
                                />
                                <Area
                                    type="monotone"
                                    dataKey={TOTAL_EMISSIONS_KEY}
                                    name={config.totalLabel}
                                    stroke={CHART_COLORS[0]}
                                    fill={CHART_COLORS[0]}
                                    fillOpacity={0.15}
                                    strokeWidth={2.5}
                                    dot={false}
                                    activeDot={{ r: 4 }}
                                />
                                {selectedCompanies.map((company, i) => (
                                    <Line
                                        key={company.id}
                                        type="monotone"
                                        dataKey={company.name}
                                        stroke={CHART_COLORS[(i + 1) % CHART_COLORS.length]}
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                        dot={false}
                                        activeDot={{ r: 4 }}
                                    />
                                ))}
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyState message={config.emptyMessage(year)} />
                    )}
                </CardContent>
            </Card>
        </Tabs>
    );
}
