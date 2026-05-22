'use client';

// 회사 상세 Scope별 감축 시나리오 — 스코프별 슬라이더로 절감량·탄소세 효과 시뮬레이션

import { CardHeading } from '@/components/shared/card-heading';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { SCOPE_COLORS, SCOPE_DESCRIPTIONS, SCOPE_LABELS, SCOPES } from '@/constants/ghg-scope';
import { CARBON_TAX_RATE_KRW_PER_TCO2E } from '@/constants/risk';
import { formatEmissions, formatKrw } from '@/lib/format';
import { useState } from 'react';

const MIN_PCT = 0;
const MAX_PCT = 60;
const STEP_PCT = 5;

type Props = {
    scopeEmissions: Record<1 | 2 | 3, number>;
    totalEmissions: number;
    year: number;
};

export function CompanyReductionScenario({ scopeEmissions, totalEmissions, year }: Props) {
    const [reductions, setReductions] = useState<Record<1 | 2 | 3, number>>({ 1: 0, 2: 0, 3: 0 });

    // 감축 후 Scope별 절감량 및 총합 계산
    const savedByScope = SCOPES.reduce(
        (acc, s) => ({ ...acc, [s]: Math.round((scopeEmissions[s] * reductions[s]) / 100) }),
        {} as Record<1 | 2 | 3, number>
    );
    const totalSaved = SCOPES.reduce((sum, s) => sum + savedByScope[s], 0);
    const newTotal = totalEmissions - totalSaved;
    const savedKrw = totalSaved * CARBON_TAX_RATE_KRW_PER_TCO2E;
    const newTaxKrw = newTotal * CARBON_TAX_RATE_KRW_PER_TCO2E;
    const reductionPct = totalEmissions > 0 ? (totalSaved / totalEmissions) * 100 : 0;

    const hasReduction = totalSaved > 0;

    return (
        <Card>
            <CardHeading
                title="감축 시나리오"
                tooltip={`Scope별 감축 목표를 설정하면 ${year}년 기준 절감 효과를 즉시 확인할 수 있습니다. 가정 세율 ${formatEmissions(CARBON_TAX_RATE_KRW_PER_TCO2E)}원/tCO₂e 기준 시나리오이며 실제 세무 산정이 아닙니다.`}
                className="pb-3"
            />

            <CardContent className="space-y-5">
                {/* Scope별 슬라이더 */}
                <div className="space-y-4">
                    {SCOPES.map((s) => {
                        const current = scopeEmissions[s];
                        const saved = savedByScope[s];
                        const reduced = current - saved;
                        const pct = reductions[s];

                        return (
                            <div key={s} className="space-y-2">
                                {/* Scope 헤더 */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="size-2.5 shrink-0 rounded-sm"
                                            style={{ backgroundColor: SCOPE_COLORS[s] }}
                                        />
                                        <span className="text-sm font-medium">
                                            {SCOPE_LABELS[s]}
                                        </span>
                                        <span className="text-muted-foreground text-xs">
                                            {SCOPE_DESCRIPTIONS[s]}
                                        </span>
                                    </div>
                                    <span
                                        className="text-sm font-bold tabular-nums"
                                        style={{ color: pct > 0 ? SCOPE_COLORS[s] : undefined }}
                                    >
                                        {pct}%
                                    </span>
                                </div>

                                {/* 슬라이더 */}
                                <input
                                    type="range"
                                    min={MIN_PCT}
                                    max={MAX_PCT}
                                    step={STEP_PCT}
                                    value={pct}
                                    onChange={(e) =>
                                        setReductions((prev) => ({
                                            ...prev,
                                            [s]: Number(e.target.value),
                                        }))
                                    }
                                    className="w-full"
                                    style={{ accentColor: SCOPE_COLORS[s] }}
                                    aria-label={`${SCOPE_LABELS[s]} 감축 목표`}
                                />

                                {/* 현재 → 감축 후 수치 */}
                                <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                                    <span className="tabular-nums">
                                        {formatEmissions(current)} tCO₂e
                                    </span>
                                    {pct > 0 && (
                                        <>
                                            <span>→</span>
                                            <span className="text-foreground font-medium tabular-nums">
                                                {formatEmissions(reduced)} tCO₂e
                                            </span>
                                            <span className="text-success">
                                                (-{formatEmissions(saved)})
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <Separator />

                {/* 통합 결과 */}
                <div className="bg-muted/40 grid grid-cols-3 gap-3 rounded-lg p-4">
                    <div className="text-center">
                        <p className="text-muted-foreground text-xs">감축 후 배출량</p>
                        <p className="mt-1 text-lg font-bold tabular-nums">
                            {hasReduction ? formatEmissions(newTotal) : '-'}
                        </p>
                        <p className="text-muted-foreground text-xs">
                            {hasReduction
                                ? `${formatEmissions(totalEmissions)} 대비 ${reductionPct.toFixed(1)}%↓`
                                : `현재 ${formatEmissions(totalEmissions)} tCO₂e`}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-muted-foreground text-xs">탄소세 절감</p>
                        <p className="text-success mt-1 text-lg font-bold tabular-nums">
                            {hasReduction ? formatKrw(savedKrw) : '-'}
                        </p>
                        <p className="text-muted-foreground text-xs">시나리오 기준</p>
                    </div>
                    <div className="text-center">
                        <p className="text-muted-foreground text-xs">감축 후 예상세</p>
                        <p className="mt-1 text-lg font-bold tabular-nums">
                            {hasReduction ? formatKrw(newTaxKrw) : '-'}
                        </p>
                        <p className="text-muted-foreground text-xs">연간 추정</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
