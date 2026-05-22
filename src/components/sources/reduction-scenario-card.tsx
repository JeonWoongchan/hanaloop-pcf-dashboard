'use client';

// 감축 시나리오 카드 — 선택 배출원 감축률별 절감량·비용 계산

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoTooltip } from '@/components/shared/info-tooltip';
import { CARBON_TAX_RATE_KRW_PER_TCO2E } from '@/constants/risk';
import { SCOPE_COLORS, SOURCE_LABELS } from '@/constants/ghg-scope';
import { formatEmissions, formatKrw } from '@/lib/format';
import { useState } from 'react';

// 감축 시나리오 슬라이더 범위
const MIN_PCT = 5;
const MAX_PCT = 60;
const STEP_PCT = 5;

type Props = {
    sourceId: string;
    scope: 1 | 2 | 3;
    sourceTotal: number;
    totalEmissions: number;
};

// 감축 시나리오 카드 렌더링
export function ReductionScenarioCard({ sourceId, scope, sourceTotal, totalEmissions }: Props) {
    const [reductionPct, setReductionPct] = useState(20);

    const label = SOURCE_LABELS[sourceId] ?? sourceId;
    const color = SCOPE_COLORS[scope];
    const savedTco2e = Math.round((sourceTotal * reductionPct) / 100);
    const savedKrw = savedTco2e * CARBON_TAX_RATE_KRW_PER_TCO2E;
    const shareOfTotal =
        totalEmissions > 0 ? ((savedTco2e / totalEmissions) * 100).toFixed(1) : '0';

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                    감축 시나리오
                    <InfoTooltip
                        content={`선택한 배출원(${label})의 감축률을 조정하면 예상 절감량과 탄소세 절감 효과를 확인할 수 있습니다. 가정 세율 ${formatEmissions(CARBON_TAX_RATE_KRW_PER_TCO2E)}원/tCO₂e 기준 시나리오입니다.`}
                    />
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* 배출원 기준선 */}
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">현재 배출량</span>
                    <span>
                        <span className="font-semibold" style={{ color }}>
                            {label}
                        </span>
                        <span className="ml-2 font-medium">
                            {formatEmissions(sourceTotal)} tCO₂e
                        </span>
                    </span>
                </div>

                {/* 감축률 슬라이더 */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">감축 목표</span>
                        <span className="text-lg font-bold" style={{ color }}>
                            {reductionPct}%
                        </span>
                    </div>
                    <input
                        type="range"
                        min={MIN_PCT}
                        max={MAX_PCT}
                        step={STEP_PCT}
                        value={reductionPct}
                        onChange={(e) => setReductionPct(Number(e.target.value))}
                        className="w-full accent-[var(--chart-1)]"
                        aria-label="감축 목표 비율"
                    />
                    <div className="text-muted-foreground flex justify-between text-xs">
                        <span>{MIN_PCT}%</span>
                        <span>{MAX_PCT}%</span>
                    </div>
                </div>

                {/* 절감 효과 */}
                <div className="bg-muted/40 grid grid-cols-3 gap-3 rounded-lg p-4">
                    <div className="text-center">
                        <p className="text-muted-foreground text-xs">절감량</p>
                        <p className="mt-1 text-lg font-bold">{formatEmissions(savedTco2e)}</p>
                        <p className="text-muted-foreground text-xs">tCO₂e</p>
                    </div>
                    <div className="text-center">
                        <p className="text-muted-foreground text-xs">탄소세 절감</p>
                        <p className="text-success mt-1 text-lg font-bold">{formatKrw(savedKrw)}</p>
                        <p className="text-muted-foreground text-xs">시나리오 기준</p>
                    </div>
                    <div className="text-center">
                        <p className="text-muted-foreground text-xs">전체 대비</p>
                        <p className="mt-1 text-lg font-bold">{shareOfTotal}%</p>
                        <p className="text-muted-foreground text-xs">포트폴리오 기여</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
