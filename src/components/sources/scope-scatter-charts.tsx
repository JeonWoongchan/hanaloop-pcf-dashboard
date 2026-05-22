'use client';

// 배출원 분석 — Scope 구성 포지셔닝 / 배출 규모×집중도 산포도

import { CardHeading } from '@/components/shared/card-heading';
import { Card, CardContent } from '@/components/ui/card';
import { CHART_AXIS_STYLE, CHART_TOOLTIP_STYLE } from '@/constants/chart';
import { SCOPE_COLORS, SCOPE_LABELS, SCOPES } from '@/constants/ghg-scope';
import type { CompanyScatterPoint } from '@/lib/emissions';
import { formatEmissions, formatKilo } from '@/lib/format';
import {
    ReferenceLine,
    ResponsiveContainer,
    Scatter,
    ScatterChart,
    Tooltip,
    XAxis,
    YAxis,
    ZAxis,
} from 'recharts';

type TooltipProps = {
    active?: boolean;
    payload?: { payload?: CompanyScatterPoint }[];
};

function PositioningTooltip({ active, payload }: TooltipProps) {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    if (!d) return null;
    return (
        <div style={CHART_TOOLTIP_STYLE} className="px-3 py-2 text-xs">
            <p className="mb-1.5 font-semibold">{d.name}</p>
            {SCOPES.map((s) => {
                const pct = s === 1 ? d.s1Pct : s === 2 ? d.s2Pct : d.s3Pct;
                return (
                    <p key={s} className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="size-1.5 rounded-full" style={{ backgroundColor: SCOPE_COLORS[s] }} />
                        {SCOPE_LABELS[s]} {pct.toFixed(1)}%
                    </p>
                );
            })}
            <p className="mt-1 text-muted-foreground">총 {formatEmissions(d.total)} tCO₂e</p>
        </div>
    );
}

function ConcentrationTooltip({ active, payload }: TooltipProps) {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    if (!d) return null;
    return (
        <div style={CHART_TOOLTIP_STYLE} className="px-3 py-2 text-xs">
            <p className="mb-1.5 font-semibold">{d.name}</p>
            <p className="text-muted-foreground">총 배출량 {formatEmissions(d.total)} tCO₂e</p>
            <p className="text-muted-foreground">최다 배출원 비중 {d.topSourcePct.toFixed(1)}%</p>
            <p className="flex items-center gap-1.5 text-muted-foreground">
                <span className="size-1.5 rounded-full" style={{ backgroundColor: SCOPE_COLORS[d.dominantScope] }} />
                지배적 Scope {SCOPE_LABELS[d.dominantScope]}
            </p>
        </div>
    );
}

function ScopeLegend() {
    return (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {SCOPES.map((s) => (
                <span key={s} className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: SCOPE_COLORS[s] }} />
                    {SCOPE_LABELS[s]}
                </span>
            ))}
        </div>
    );
}

type Props = {
    data: CompanyScatterPoint[];
    year: number;
};

export function ScopeScatterCharts({ data, year }: Props) {
    if (data.length === 0) return null;

    const byScope = (s: 1 | 2 | 3) => data.filter((d) => d.dominantScope === s);

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* ① Scope 구성 포지셔닝 */}
            <Card>
                <CardHeading
                    title="Scope 구성 포지셔닝"
                    tooltip="각 회사의 Scope 1(직접 배출)과 Scope 2(전기·열) 비중을 X·Y축에 배치합니다. 버블이 클수록 총 배출량이 많습니다. 오른쪽 하단은 직접 연소 중심, 왼쪽 상단은 전기·열 의존형, 왼쪽 하단은 Scope 3(공급망) 비중이 큰 회사입니다. 점선은 각 축 33% 기준선입니다."
                    description={`${year}년 · Scope 1 vs Scope 2 비중 · 버블 크기 = 총 배출량`}
                />
                <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                        <ScatterChart margin={{ top: 8, right: 16, bottom: 28, left: 8 }}>
                            <XAxis
                                dataKey="s1Pct"
                                type="number"
                                name="Scope 1 비중"
                                unit="%"
                                domain={[0, 100]}
                                tick={CHART_AXIS_STYLE}
                                axisLine={false}
                                tickLine={false}
                                label={{ value: 'Scope 1 비중 (%)', position: 'insideBottom', offset: -16, ...CHART_AXIS_STYLE }}
                            />
                            <YAxis
                                dataKey="s2Pct"
                                type="number"
                                name="Scope 2 비중"
                                unit="%"
                                domain={[0, 100]}
                                tick={CHART_AXIS_STYLE}
                                axisLine={false}
                                tickLine={false}
                                label={{ value: 'Scope 2 비중 (%)', angle: -90, position: 'insideLeft', offset: 16, ...CHART_AXIS_STYLE }}
                            />
                            <ZAxis dataKey="total" range={[40, 400]} />
                            <Tooltip content={<PositioningTooltip />} />
                            {/* 삼등분 기준선 — 각 Scope 비중 33% 경계 */}
                            <ReferenceLine x={33} stroke="var(--border)" strokeDasharray="3 3" />
                            <ReferenceLine y={33} stroke="var(--border)" strokeDasharray="3 3" />
                            {SCOPES.map((s) => (
                                <Scatter
                                    key={s}
                                    name={SCOPE_LABELS[s]}
                                    data={byScope(s)}
                                    fill={SCOPE_COLORS[s]}
                                    fillOpacity={0.8}
                                />
                            ))}
                        </ScatterChart>
                    </ResponsiveContainer>
                    <ScopeLegend />
                </CardContent>
            </Card>

            {/* ② 배출 규모 × 배출원 집중도 */}
            <Card>
                <CardHeading
                    title="배출 규모 × 집중도"
                    tooltip="X축은 연간 총 배출량, Y축은 단일 배출원이 전체에서 차지하는 최대 비중입니다. 오른쪽 상단(배출 많고 집중)은 하나의 배출원에 대한 의존도가 높아 감축 레버가 명확합니다. 오른쪽 하단(배출 많고 분산)은 여러 배출원을 동시에 관리해야 하는 복잡한 구조입니다. 점 색상은 지배적 Scope를 나타냅니다."
                    description={`${year}년 · 총 배출량 vs 최다 단일 배출원 비중`}
                />
                <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                        <ScatterChart margin={{ top: 8, right: 16, bottom: 28, left: 8 }}>
                            <XAxis
                                dataKey="total"
                                type="number"
                                name="총 배출량"
                                tickFormatter={formatKilo}
                                tick={CHART_AXIS_STYLE}
                                axisLine={false}
                                tickLine={false}
                                label={{ value: '총 배출량 (tCO₂e)', position: 'insideBottom', offset: -16, ...CHART_AXIS_STYLE }}
                            />
                            <YAxis
                                dataKey="topSourcePct"
                                type="number"
                                name="최다 배출원 비중"
                                unit="%"
                                domain={[0, 100]}
                                tick={CHART_AXIS_STYLE}
                                axisLine={false}
                                tickLine={false}
                                label={{ value: '최다 배출원 비중 (%)', angle: -90, position: 'insideLeft', offset: 16, ...CHART_AXIS_STYLE }}
                            />
                            <ZAxis range={[60, 60]} />
                            <Tooltip content={<ConcentrationTooltip />} />
                            {SCOPES.map((s) => (
                                <Scatter
                                    key={s}
                                    name={SCOPE_LABELS[s]}
                                    data={byScope(s)}
                                    fill={SCOPE_COLORS[s]}
                                    fillOpacity={0.8}
                                />
                            ))}
                        </ScatterChart>
                    </ResponsiveContainer>
                    <ScopeLegend />
                </CardContent>
            </Card>
        </div>
    );
}
