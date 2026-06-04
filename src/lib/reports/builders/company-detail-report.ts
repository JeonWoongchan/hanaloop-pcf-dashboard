import { SCOPE_LABELS, SCOPE_MAP, SOURCE_LABELS } from '@/constants/ghg-scope';
import { RISK_LEVEL_LABELS } from '@/constants/risk';
import { formatReportDateTime } from '../format-utils';
import {
    filterActivityRecordsByYear,
    filterByYear,
    getPcfScopeTotals,
    getScopeTotals,
    getTotalBySource,
    sumEmissions,
    sumPcf,
} from '@/lib/emissions';
import type { RiskAssessment } from '@/lib/risk';
import type { ActivityRecord, Company, Post } from '@/types';
import type { ReportRow, ReportWorkbook } from '../types';

export type CompanyDetailReportInput = {
    company: Company;
    year: number;
    activityRecords: ActivityRecord[];
    actionNotes: Post[];
    riskAssessment?: RiskAssessment | null;
    riskRank?: number | null;
    riskTotal?: number;
    exportedAt?: Date;
};

export function buildCompanyDetailReportWorkbook({
    company,
    year,
    activityRecords,
    actionNotes,
    riskAssessment,
    riskRank = null,
    riskTotal = 0,
    exportedAt = new Date(),
}: CompanyDetailReportInput): ReportWorkbook {
    const emissions = filterByYear(company.emissions, year);
    const yearActivityRecords = filterActivityRecordsByYear(activityRecords, year);
    const companyActionNotes = getCompanyActionNotes(actionNotes, company.id);
    const annualGhgTotal = sumEmissions(emissions);
    const annualPcfTotal = sumPcf(yearActivityRecords);

    return {
        fileName: `company-detail-${company.name}-${year}`,
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
                    company,
                    year,
                    exportedAt,
                    annualGhgTotal,
                    annualPcfTotal,
                    ghgRecordCount: emissions.length,
                    activityRecordCount: yearActivityRecords.length,
                    actionNoteCount: companyActionNotes.length,
                    riskAssessment,
                    riskRank,
                    riskTotal,
                }),
            },
            {
                name: '월별 배출량',
                columns: [
                    { key: 'month', header: '월', width: 12 },
                    { key: 'ghgScope1Tco2e', header: 'GHG Scope 1(tCO2e)', width: 20 },
                    { key: 'ghgScope2Tco2e', header: 'GHG Scope 2(tCO2e)', width: 20 },
                    { key: 'ghgScope3Tco2e', header: 'GHG Scope 3(tCO2e)', width: 20 },
                    { key: 'ghgTotalTco2e', header: 'GHG 합계(tCO2e)', width: 18 },
                    { key: 'pcfScope1KgCo2e', header: 'PCF Scope 1(kgCO2e)', width: 22 },
                    { key: 'pcfScope2KgCo2e', header: 'PCF Scope 2(kgCO2e)', width: 22 },
                    { key: 'pcfScope3KgCo2e', header: 'PCF Scope 3(kgCO2e)', width: 22 },
                    { key: 'pcfTotalKgCo2e', header: 'PCF 합계(kgCO2e)', width: 20 },
                ],
                rows: buildMonthlyRows(emissions, yearActivityRecords),
            },
            {
                name: 'Scope별 배출',
                columns: [
                    { key: 'scope', header: 'Scope', width: 12 },
                    { key: 'ghgEmissionsTco2e', header: 'GHG 배출량(tCO2e)', width: 20 },
                    { key: 'ghgSharePct', header: 'GHG 비중(%)', width: 16 },
                    { key: 'pcfEmissionsKgCo2e', header: 'PCF 배출량(kgCO2e)', width: 22 },
                    { key: 'pcfSharePct', header: 'PCF 비중(%)', width: 16 },
                ],
                rows: buildScopeRows(emissions, yearActivityRecords),
            },
            {
                name: '배출원별 배출',
                columns: [
                    { key: 'sourceCode', header: '배출원 코드', width: 18 },
                    { key: 'sourceName', header: '배출원', width: 16 },
                    { key: 'scope', header: 'Scope', width: 12 },
                    { key: 'ghgEmissionsTco2e', header: 'GHG 배출량(tCO2e)', width: 20 },
                    { key: 'pcfEmissionsKgCo2e', header: 'PCF 배출량(kgCO2e)', width: 22 },
                ],
                rows: buildSourceRows(emissions, yearActivityRecords),
            },
            {
                name: '활동 데이터',
                columns: [
                    { key: 'activityDate', header: '활동일', width: 14 },
                    { key: 'yearMonth', header: '연월', width: 12 },
                    { key: 'activityType', header: '활동 유형', width: 18 },
                    { key: 'description', header: '설명', width: 32 },
                    { key: 'quantity', header: '사용량', width: 14 },
                    { key: 'unit', header: '단위', width: 10 },
                    { key: 'sourceCode', header: '배출원 코드', width: 18 },
                    { key: 'sourceName', header: '배출원', width: 16 },
                    { key: 'scope', header: 'Scope', width: 12 },
                    { key: 'emissionFactorKg', header: '배출계수(kgCO2e/unit)', width: 24 },
                    { key: 'emissionsKg', header: '배출량(kgCO2e)', width: 18 },
                    { key: 'emissionsTco2e', header: '배출량(tCO2e)', width: 18 },
                    { key: 'importFileName', header: '임포트 파일', width: 26 },
                    { key: 'importRowNumber', header: '원본 행', width: 10 },
                    { key: 'createdAt', header: '등록일시', width: 20 },
                ],
                rows: buildActivityRows(yearActivityRecords),
            },
            {
                name: 'Action Notes',
                columns: [
                    { key: 'dateTime', header: '작성일시', width: 20 },
                    { key: 'author', header: '작성자', width: 16 },
                    { key: 'title', header: '제목', width: 28 },
                    { key: 'content', header: '내용', width: 64 },
                ],
                rows: companyActionNotes.map((post) => ({
                    dateTime: post.dateTime,
                    author: post.author,
                    title: post.title,
                    content: post.content,
                })),
            },
        ],
    };
}

function buildSummaryRows({
    company,
    year,
    exportedAt,
    annualGhgTotal,
    annualPcfTotal,
    ghgRecordCount,
    activityRecordCount,
    actionNoteCount,
    riskAssessment,
    riskRank,
    riskTotal,
}: {
    company: Company;
    year: number;
    exportedAt: Date;
    annualGhgTotal: number;
    annualPcfTotal: number;
    ghgRecordCount: number;
    activityRecordCount: number;
    actionNoteCount: number;
    riskAssessment?: RiskAssessment | null;
    riskRank: number | null;
    riskTotal: number;
}): ReportRow[] {
    return [
        {
            item: '작성일시',
            value: formatReportDateTime(exportedAt),
            unit: null,
            description: '보고서를 생성한 로컬 시각입니다.',
        },
        {
            item: '회사',
            value: company.name,
            unit: null,
            description: '회사 상세 페이지의 현재 회사입니다.',
        },
        {
            item: '국가',
            value: company.country,
            unit: null,
            description: '회사에 등록된 국가 코드입니다.',
        },
        {
            item: '기준 연도',
            value: year,
            unit: '년',
            description: '회사 상세 페이지에서 선택한 연도입니다.',
        },
        {
            item: '연간 GHG 집계 배출량',
            value: annualGhgTotal,
            unit: 'tCO2e',
            description: '선택 연도 GHG 배출량 합계입니다.',
        },
        {
            item: '연간 PCF',
            value: annualPcfTotal,
            unit: 'kgCO2e',
            description: '선택 연도 활동 데이터 기반 PCF 합계입니다.',
        },
        {
            item: 'GHG 배출량 행 수',
            value: ghgRecordCount,
            unit: '건',
            description: '선택 연도에 포함된 GHG 배출량 데이터 행 수입니다.',
        },
        {
            item: '활동 데이터 건수',
            value: activityRecordCount,
            unit: '건',
            description: '선택 연도에 포함된 PCF 활동 데이터 행 수입니다.',
        },
        {
            item: 'Action Notes 수',
            value: actionNoteCount,
            unit: '건',
            description: '회사에 작성된 Action Notes 전체 건수입니다.',
        },
        {
            item: '리스크 등급',
            value: riskAssessment ? RISK_LEVEL_LABELS[riskAssessment.level] : null,
            unit: null,
            description: '선택 연도 리스크 평가 등급입니다.',
        },
        {
            item: '리스크 점수',
            value: riskAssessment?.score ?? null,
            unit: '점',
            description: '선택 연도 리스크 점수입니다.',
        },
        {
            item: '리스크 순위',
            value: riskRank,
            unit: '위',
            description: riskTotal > 0 ? `전체 ${riskTotal}개사 기준 순위입니다.` : null,
        },
        {
            item: '필요 배출권',
            value: riskAssessment?.requiredAllowances ?? null,
            unit: '개',
            description: '1 tCO2e를 배출권 1개로 보고 연간 배출량을 올림 환산했습니다.',
        },
        {
            item: '예상 배출권 구매비용',
            value: riskAssessment?.estimatedAllowanceCostKrw ?? null,
            unit: '원',
            description: '필요 배출권에 선택 연도 배출권 단가를 곱한 시나리오 금액입니다.',
        },
    ];
}

function buildMonthlyRows(emissions: Company['emissions'], records: ActivityRecord[]): ReportRow[] {
    const months = Array.from(
        new Set([
            ...emissions.map((emission) => emission.yearMonth),
            ...records.map((r) => r.yearMonth),
        ])
    ).sort();

    return months.map((month) => {
        const monthEmissions = emissions.filter((emission) => emission.yearMonth === month);
        const monthRecords = records.filter((record) => record.yearMonth === month);
        const ghgScopes = getRoundedScopeTotals(monthEmissions);
        const pcfScopes = getPcfScopeTotals(monthRecords);

        return {
            month,
            ghgScope1Tco2e: ghgScopes[1],
            ghgScope2Tco2e: ghgScopes[2],
            ghgScope3Tco2e: ghgScopes[3],
            ghgTotalTco2e: sumEmissions(monthEmissions),
            pcfScope1KgCo2e: pcfScopes[1],
            pcfScope2KgCo2e: pcfScopes[2],
            pcfScope3KgCo2e: pcfScopes[3],
            pcfTotalKgCo2e: sumPcf(monthRecords),
        };
    });
}

function buildScopeRows(emissions: Company['emissions'], records: ActivityRecord[]): ReportRow[] {
    const ghgScopes = getRoundedScopeTotals(emissions);
    const pcfScopes = getPcfScopeTotals(records);
    const ghgTotal = Math.max(ghgScopes[1] + ghgScopes[2] + ghgScopes[3], 0);
    const pcfTotal = pcfScopes[1] + pcfScopes[2] + pcfScopes[3];

    return ([1, 2, 3] as const).map((scope) => ({
        scope: SCOPE_LABELS[scope],
        ghgEmissionsTco2e: ghgScopes[scope],
        ghgSharePct: ghgTotal > 0 ? round1((ghgScopes[scope] / ghgTotal) * 100) : 0,
        pcfEmissionsKgCo2e: pcfScopes[scope],
        pcfSharePct: pcfTotal > 0 ? round1((pcfScopes[scope] / pcfTotal) * 100) : 0,
    }));
}

function buildSourceRows(emissions: Company['emissions'], records: ActivityRecord[]): ReportRow[] {
    const ghgSourceTotals = new Map(getTotalBySource(emissions).map((item) => [item.source, item]));
    const pcfSourceTotals = getPcfSourceTotals(records);
    const sources = Array.from(
        new Set([...ghgSourceTotals.keys(), ...pcfSourceTotals.keys()])
    ).sort((a, b) => {
        const ghgDiff = (ghgSourceTotals.get(b)?.total ?? 0) - (ghgSourceTotals.get(a)?.total ?? 0);
        if (ghgDiff !== 0) return ghgDiff;
        return (pcfSourceTotals.get(b) ?? 0) - (pcfSourceTotals.get(a) ?? 0);
    });

    return sources.map((source) => {
        const ghgSource = ghgSourceTotals.get(source);
        const scope = ghgSource?.scope ?? getRecordScope(records, source) ?? SCOPE_MAP[source] ?? 3;

        return {
            sourceCode: source,
            sourceName: SOURCE_LABELS[source] ?? source,
            scope: SCOPE_LABELS[scope],
            ghgEmissionsTco2e: ghgSource?.total ?? 0,
            pcfEmissionsKgCo2e: pcfSourceTotals.get(source) ?? 0,
        };
    });
}

function buildActivityRows(records: ActivityRecord[]): ReportRow[] {
    return [...records]
        .sort((a, b) => {
            const dateDiff = a.activityDate.localeCompare(b.activityDate);
            if (dateDiff !== 0) return dateDiff;
            return (a.importRowNumber ?? 0) - (b.importRowNumber ?? 0);
        })
        .map((record) => ({
            activityDate: record.activityDate,
            yearMonth: record.yearMonth,
            activityType: record.activityType,
            description: record.description,
            quantity: record.quantity,
            unit: record.unit,
            sourceCode: record.source,
            sourceName: SOURCE_LABELS[record.source] ?? record.source,
            scope: SCOPE_LABELS[record.scope],
            emissionFactorKg: record.emissionFactorKg,
            emissionsKg: record.emissionsKg,
            emissionsTco2e: record.emissionsTco2e,
            importFileName: record.importFileName,
            importRowNumber: record.importRowNumber,
            createdAt: record.createdAt,
        }));
}

function getRoundedScopeTotals(emissions: Company['emissions']): Record<1 | 2 | 3, number> {
    const totals = getScopeTotals(emissions);
    return {
        1: Math.round(totals[1]),
        2: Math.round(totals[2]),
        3: Math.round(totals[3]),
    };
}

function getPcfSourceTotals(records: ActivityRecord[]): Map<string, number> {
    const totals = new Map<string, number>();

    for (const record of records) {
        totals.set(record.source, (totals.get(record.source) ?? 0) + record.emissionsKg);
    }

    return new Map(Array.from(totals.entries()).map(([source, total]) => [source, round4(total)]));
}

function getRecordScope(records: ActivityRecord[], source: string): 1 | 2 | 3 | null {
    return records.find((record) => record.source === source)?.scope ?? null;
}

function getCompanyActionNotes(actionNotes: Post[], companyId: string): Post[] {
    return actionNotes
        .filter((post) => post.resourceUid === companyId)
        .sort((a, b) => a.dateTime.localeCompare(b.dateTime));
}

function round1(value: number) {
    return Number(value.toFixed(1));
}

function round4(value: number) {
    return Number(value.toFixed(4));
}

