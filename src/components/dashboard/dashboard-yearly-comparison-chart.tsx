'use client';

import { YearlyComparisonChart } from '@/components/shared/yearly-comparison-chart';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { AnnualTotal } from '@/lib/emissions';
import {
    formatEmissions,
    formatPcfEmissions,
    GHG_EMISSIONS_UNIT,
    PCF_EMISSIONS_UNIT,
} from '@/lib/format';
import { useState } from 'react';

type ChartMode = 'pcf' | 'emissions';

type Props = {
    emissionsData: AnnualTotal[];
    pcfData: AnnualTotal[];
    selectedYear: number;
};

const MODE_CONFIG = {
    pcf: {
        title: '연도별 총 PCF 추이',
        description: `전체 회사 합산 · 연도별 원본 활동 데이터 기반 PCF (${PCF_EMISSIONS_UNIT})`,
        helpText:
            '연도별 PCF 산정값 합산 추이입니다. 제품 생산량 보정 없이 업로드된 활동 데이터 기준 합산값으로 해석합니다.',
        valueLabel: '총 PCF',
        unit: PCF_EMISSIONS_UNIT,
        formatValue: formatPcfEmissions,
    },
    emissions: {
        title: '연도별 총 배출량 추이',
        description: `전체 회사 합산 · 연도별 누적 온실가스 배출량 (${GHG_EMISSIONS_UNIT})`,
        helpText:
            '전체 기업 합산 기준 연도별 배출량 추이입니다. 강조 표시된 막대가 현재 선택한 연도입니다.',
        valueLabel: '총 배출량',
        unit: GHG_EMISSIONS_UNIT,
        formatValue: formatEmissions,
    },
} satisfies Record<
    ChartMode,
    {
        title: string;
        description: string;
        helpText: string;
        valueLabel: string;
        unit: string;
        formatValue: (value: number) => string;
    }
>;

export function DashboardYearlyComparisonChart({ emissionsData, pcfData, selectedYear }: Props) {
    const [mode, setMode] = useState<ChartMode>('pcf');
    const config = MODE_CONFIG[mode];

    return (
        <Tabs value={mode} onValueChange={(value) => setMode(value as ChartMode)}>
            <YearlyComparisonChart
                data={mode === 'pcf' ? pcfData : emissionsData}
                selectedYear={selectedYear}
                title={config.title}
                description={config.description}
                helpText={config.helpText}
                valueLabel={config.valueLabel}
                unit={config.unit}
                formatValueAction={config.formatValue}
                action={
                    <TabsList>
                        <TabsTrigger value="pcf">PCF</TabsTrigger>
                        <TabsTrigger value="emissions">배출량</TabsTrigger>
                    </TabsList>
                }
            />
        </Tabs>
    );
}
