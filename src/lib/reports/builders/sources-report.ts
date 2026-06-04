import { SCOPE_LABELS, SOURCE_LABELS } from '@/constants/ghg-scope';
import type { CompanyTotal, MonthlyTotal } from '@/lib/emissions';
import type { ReportRow, ReportWorkbook } from '../types';

export type SourcesReportSourceItem = {
    source: string;
    total: number;
    scope: 1 | 2 | 3;
};

export type SourcesReportInput = {
    year: number;
    allSources: SourcesReportSourceItem[];
    activeSource: SourcesReportSourceItem | null;
    scopeTotals: Record<1 | 2 | 3, number>;
    companyBreakdown: CompanyTotal[];
    monthlyTrend: MonthlyTotal[];
    totalEmissions: number;
    totalCompanies: number;
    exportedAt?: Date;
};

export function buildSourcesReportWorkbook({
    year,
    allSources,
    activeSource,
    scopeTotals,
    companyBreakdown,
    monthlyTrend,
    totalEmissions,
    totalCompanies,
    exportedAt = new Date(),
}: SourcesReportInput): ReportWorkbook {
    return {
        fileName: `sources-report-${year}-${activeSource?.source ?? 'all'}`,
        sheets: [
            {
                name: '요약',
                columns: [
                    { key: 'item', header: '항목', width: 24 },
                    { key: 'value', header: '값', width: 22 },
                    { key: 'unit', header: '단위', width: 14 },
                    { key: 'description', header: '설명', width: 58 },
                ],
                rows: buildSummaryRows({
                    year,
                    activeSource,
                    scopeTotals,
                    allSources,
                    totalEmissions,
                    totalCompanies,
                    companyBreakdown,
                    monthlyTrend,
                    exportedAt,
                }),
            },
            {
                name: '배출원 순위',
                columns: [
                    { key: 'rank', header: '순위', width: 8 },
                    { key: 'sourceCode', header: '배출원 코드', width: 18 },
                    { key: 'sourceName', header: '배출원', width: 18 },
                    { key: 'scope', header: 'Scope', width: 12 },
                    { key: 'emissionsTco2e', header: '배출량(tCO2e)', width: 18 },
                    { key: 'sharePct', header: '전체 비중(%)', width: 16 },
                    { key: 'selected', header: '선택 배출원', width: 14 },
                ],
                rows: allSources.map((source, index) => ({
                    rank: index + 1,
                    sourceCode: source.source,
                    sourceName: getSourceLabel(source.source),
                    scope: SCOPE_LABELS[source.scope],
                    emissionsTco2e: source.total,
                    sharePct:
                        totalEmissions > 0 ? round1((source.total / totalEmissions) * 100) : 0,
                    selected: activeSource?.source === source.source ? '예' : '',
                })),
            },
            {
                name: '선택 배출원 월별 추이',
                columns: [
                    { key: 'sourceCode', header: '배출원 코드', width: 18 },
                    { key: 'sourceName', header: '배출원', width: 18 },
                    { key: 'scope', header: 'Scope', width: 12 },
                    { key: 'month', header: '월', width: 12 },
                    { key: 'emissionsTco2e', header: '배출량(tCO2e)', width: 18 },
                ],
                rows: monthlyTrend.map((month) => ({
                    sourceCode: activeSource?.source ?? null,
                    sourceName: activeSource ? getSourceLabel(activeSource.source) : null,
                    scope: activeSource ? SCOPE_LABELS[activeSource.scope] : null,
                    month: month.month,
                    emissionsTco2e: month.total,
                })),
            },
            {
                name: '선택 배출원 회사별 기여',
                columns: [
                    { key: 'rank', header: '순위', width: 8 },
                    { key: 'sourceCode', header: '배출원 코드', width: 18 },
                    { key: 'sourceName', header: '배출원', width: 18 },
                    { key: 'scope', header: 'Scope', width: 12 },
                    { key: 'companyName', header: '회사', width: 26 },
                    { key: 'country', header: '국가', width: 10 },
                    { key: 'emissionsTco2e', header: '배출량(tCO2e)', width: 18 },
                    { key: 'sourceSharePct', header: '선택 배출원 내 비중(%)', width: 24 },
                ],
                rows: companyBreakdown.map((company, index) => ({
                    rank: index + 1,
                    sourceCode: activeSource?.source ?? null,
                    sourceName: activeSource ? getSourceLabel(activeSource.source) : null,
                    scope: activeSource ? SCOPE_LABELS[activeSource.scope] : null,
                    companyName: company.name,
                    country: company.country,
                    emissionsTco2e: company.total,
                    sourceSharePct:
                        activeSource && activeSource.total > 0
                            ? round1((company.total / activeSource.total) * 100)
                            : 0,
                })),
            },
        ],
    };
}

function buildSummaryRows({
    year,
    activeSource,
    scopeTotals,
    allSources,
    totalEmissions,
    totalCompanies,
    companyBreakdown,
    monthlyTrend,
    exportedAt,
}: Required<
    Pick<
        SourcesReportInput,
        | 'year'
        | 'activeSource'
        | 'scopeTotals'
        | 'allSources'
        | 'totalEmissions'
        | 'totalCompanies'
        | 'companyBreakdown'
        | 'monthlyTrend'
    >
> & {
    exportedAt: Date;
}): ReportRow[] {
    return [
        {
            item: '작성일시',
            value: formatReportDateTime(exportedAt),
            unit: null,
            description: '보고서를 생성한 로컬 시각입니다.',
        },
        {
            item: '기준 연도',
            value: year,
            unit: '년',
            description: '배출원 분석 페이지에서 선택한 연도입니다.',
        },
        {
            item: '관리 대상 회사 수',
            value: totalCompanies,
            unit: '개',
            description: '현재 등록된 관리 대상 회사 수입니다.',
        },
        {
            item: '총 배출량',
            value: totalEmissions,
            unit: 'tCO2e',
            description: '선택 연도 전체 관리 대상의 GHG 배출량 합계입니다.',
        },
        {
            item: '배출원 수',
            value: allSources.length,
            unit: '개',
            description: '선택 연도에 배출량이 집계된 배출원 수입니다.',
        },
        {
            item: '선택 배출원',
            value: activeSource ? getSourceLabel(activeSource.source) : null,
            unit: null,
            description: '배출원 분석 페이지에서 현재 선택된 배출원입니다.',
        },
        {
            item: '선택 배출원 코드',
            value: activeSource?.source ?? null,
            unit: null,
            description: '선택 배출원의 내부 코드입니다.',
        },
        {
            item: '선택 배출원 Scope',
            value: activeSource ? SCOPE_LABELS[activeSource.scope] : null,
            unit: null,
            description: '선택 배출원이 속한 GHG Scope입니다.',
        },
        {
            item: '선택 배출원 배출량',
            value: activeSource?.total ?? null,
            unit: 'tCO2e',
            description: '선택 연도 기준 선택 배출원의 총 배출량입니다.',
        },
        {
            item: '선택 배출원 전체 비중',
            value:
                activeSource && totalEmissions > 0
                    ? round1((activeSource.total / totalEmissions) * 100)
                    : null,
            unit: '%',
            description: '전체 배출량 중 선택 배출원이 차지하는 비중입니다.',
        },
        {
            item: '선택 배출원 기여 회사 수',
            value: companyBreakdown.length,
            unit: '개',
            description: '선택 배출원 배출량이 있는 회사 수입니다.',
        },
        {
            item: '선택 배출원 월 데이터 수',
            value: monthlyTrend.length,
            unit: '개월',
            description: '선택 배출원 월별 추이 데이터 포인트 수입니다.',
        },
        ...([1, 2, 3] as const).map((scope) => ({
            item: `${SCOPE_LABELS[scope]} 배출량`,
            value: Math.round(scopeTotals[scope]),
            unit: 'tCO2e',
            description: `${SCOPE_LABELS[scope]}에 속한 배출원 전체 배출량입니다.`,
        })),
    ];
}

function getSourceLabel(source: string): string {
    return SOURCE_LABELS[source] ?? source;
}

function round1(value: number) {
    return Number(value.toFixed(1));
}

function formatReportDateTime(date: Date): string {
    const year = date.getFullYear();
    const month = pad2(date.getMonth() + 1);
    const day = pad2(date.getDate());
    const hours = pad2(date.getHours());
    const minutes = pad2(date.getMinutes());

    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function pad2(value: number) {
    return String(value).padStart(2, '0');
}
