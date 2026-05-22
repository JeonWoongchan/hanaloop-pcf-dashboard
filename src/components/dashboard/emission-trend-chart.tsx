'use client';

// 월간 배출량 추이 차트 — 전체 합산 뷰 / 회사별 비교 뷰 탭 전환

import { Badge } from '@/components/ui/badge';
import { CardHeading } from '@/components/shared/card-heading';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MultiSelectPopover } from '@/components/shared/multi-select-popover';
import { CHART_AXIS_STYLE, CHART_COLORS, CHART_TOOLTIP_STYLE } from '@/constants/chart';
import { TOTAL_EMISSIONS_KEY } from '@/lib/emissions';
import { formatMonthShort, formatTooltipValue, formatYearMonth } from '@/lib/format';
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
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

// 합산 탭에서 동시에 비교 가능한 최대 회사 수
const MAX_COMPARE = 5;
// nuqs URL 배열 상태 파서 — 두 탭 공통
const companyIdsParser = parseAsArrayOf(parseAsString).withDefault([]);

type Props = {
    data: Record<string, number | string>[];
    companies: Company[];
    year: number;
};

// 공통 차트 축/그리드 설정
function ChartAxes({ yDomain }: { yDomain?: [number, (dataMax: number) => number] }) {
    return (
        <>
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
                domain={yDomain}
            />
            <Tooltip
                labelFormatter={(label) =>
                    typeof label === 'string' ? formatYearMonth(label) : ''
                }
                formatter={formatTooltipValue}
                contentStyle={CHART_TOOLTIP_STYLE}
            />
            <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 16 }}
                formatter={(v) => <span style={{ color: 'var(--foreground)' }}>{v}</span>}
            />
        </>
    );
}

type CompanyBadgeListProps = {
    companies: Company[];
    onRemove: (id: string) => void;
    colorOffset?: number;
};

// 선택된 회사 목록을 색상 구분 뱃지로 렌더링
function CompanyBadgeList({ companies, onRemove, colorOffset = 0 }: CompanyBadgeListProps) {
    return (
        <>
            {companies.map((company, i) => (
                <Badge
                    key={company.id}
                    variant="secondary"
                    className="gap-1 pr-1"
                    style={{
                        borderLeft: `3px solid ${CHART_COLORS[(i + colorOffset) % CHART_COLORS.length]}`,
                    }}
                >
                    {company.name}
                    <button
                        onClick={() => onRemove(company.id)}
                        className="hover:text-foreground ml-0.5 rounded"
                    >
                        <X className="size-3" />
                    </button>
                </Badge>
            ))}
        </>
    );
}

// 합산 탭 — 전체 라인 + 선택된 회사 비교 오버레이
function AggregateTab({ data, companies }: { data: Props['data']; companies: Company[] }) {
    const [selectedIds, setSelectedIds] = useQueryState('compareCompanies', companyIdsParser);
    const [open, setOpen] = useState(false);

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
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
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
                <CompanyBadgeList
                    companies={selectedCompanies}
                    onRemove={toggleCompany}
                    colorOffset={1}
                />
            </div>

            <ResponsiveContainer width="100%" height={300}>
                {/* Y축 최댓값을 실제 최대의 2배로 지정 — 차트가 하단 절반에 표시되어 여백감 확보 */}
                <AreaChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                    <ChartAxes yDomain={[0, (dataMax) => dataMax * 2]} />
                    {/* 항상 표시: 전체 합산 에어리어 */}
                    <Area
                        type="monotone"
                        dataKey={TOTAL_EMISSIONS_KEY}
                        stroke={CHART_COLORS[0]}
                        fill={CHART_COLORS[0]}
                        fillOpacity={0.15}
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 4 }}
                    />
                    {/* 선택된 회사 오버레이 — 점선 라인으로 에어리어 위에 표시 */}
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
        </div>
    );
}

// 비교 탭 — 필터 선택된 회사만 표시 (기본: 전체)
function ComparisonTab({ data, companies }: { data: Props['data']; companies: Company[] }) {
    const [filteredIds, setFilteredIds] = useQueryState('comparisonCompanies', companyIdsParser);
    const [open, setOpen] = useState(false);

    // filteredIds가 빈 배열 = 전체 모드 (모든 회사 표시 + 드롭다운 전체 체크)
    const isAllMode = filteredIds.length === 0;
    const visibleCompanies = isAllMode
        ? companies
        : companies.filter((c) => filteredIds.includes(c.id));

    const toggleCompany = (id: string) => {
        if (isAllMode) {
            // 전체 모드에서 하나 해제 → 나머지 전부를 명시적으로 선택
            void setFilteredIds(companies.filter((c) => c.id !== id).map((c) => c.id));
        } else if (filteredIds.includes(id)) {
            void setFilteredIds(filteredIds.filter((s) => s !== id));
        } else {
            const next = [...filteredIds, id];
            // 모든 회사가 선택되면 URL을 깔끔하게 전체 모드로 전환
            void setFilteredIds(next.length === companies.length ? [] : next);
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
                <MultiSelectPopover
                    items={companies.map((c) => ({ id: c.id, label: c.name }))}
                    label={isAllMode ? '전체 표시 중' : `${filteredIds.length}개 선택됨`}
                    open={open}
                    onOpenChangeAction={setOpen}
                    // 드롭다운 체크 여부 — 전체 모드이면 모든 항목이 체크 상태
                    isSelectedAction={(id) => isAllMode || filteredIds.includes(id)}
                    onToggleAction={toggleCompany}
                    searchPlaceholder="회사 검색..."
                />
                {!isAllMode && (
                    <CompanyBadgeList companies={visibleCompanies} onRemove={toggleCompany} />
                )}
            </div>

            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                    <ChartAxes />
                    {visibleCompanies.map((company, i) => (
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
        </div>
    );
}

// 탭 전환 가능한 월간 배출량 추이 차트 렌더링
export function EmissionTrendChart({ data, companies, year }: Props) {
    return (
        <Card>
            <CardHeading
                title="월간 배출량 추이"
                tooltip={
                    '전체 기업 합산 또는 기업별 월간 배출량을 차트로 표시합니다.\n\n전체 합산 탭: 합산 추이를 에어리어 차트로 표시하며, 특정 기업을 최대 5개까지 점선으로 오버레이 비교할 수 있습니다.\n\n회사별 비교 탭: 원하는 기업만 선택해 라인 차트로 비교합니다.'
                }
                description={`${year}년 월간 온실가스 배출량 (tCO₂e)`}
            />
            <CardContent>
                <Tabs defaultValue="aggregate">
                    <TabsList className="mb-4">
                        <TabsTrigger value="aggregate">전체 합산</TabsTrigger>
                        <TabsTrigger value="comparison">회사별 비교</TabsTrigger>
                    </TabsList>
                    <TabsContent value="aggregate">
                        <AggregateTab data={data} companies={companies} />
                    </TabsContent>
                    <TabsContent value="comparison">
                        <ComparisonTab data={data} companies={companies} />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
