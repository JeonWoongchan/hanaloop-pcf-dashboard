import { SCOPE_LABELS } from '@/constants/ghg-scope';
import { RISK_LEVEL_LABELS } from '@/constants/risk';
import { formatReportDateTime } from '../format-utils';
import {
    filterByYear,
    getPcfScopeTotals,
    sumEmissions,
    type CompanyPcfTotal,
} from '@/lib/emissions';
import type { RiskAssessment } from '@/lib/risk';
import type { ReportRow, ReportWorkbook } from '../types';

export type CompaniesReportSortOrder = 'desc' | 'asc' | 'name';

export type CompaniesReportCountryOption = {
    code: string;
    name: string;
};

export type CompaniesReportInput = {
    year: number;
    companies: CompanyPcfTotal[];
    totalCompanyCount: number;
    selectedCountries: string[];
    countryOptions: CompaniesReportCountryOption[];
    sortOrder: CompaniesReportSortOrder;
    riskMap?: Map<string, RiskAssessment>;
    exportedAt?: Date;
};

const SORT_LABELS: Record<CompaniesReportSortOrder, string> = {
    desc: 'PCF 높은 순',
    asc: 'PCF 낮은 순',
    name: '회사명 순',
};

export function buildCompaniesReportWorkbook({
    year,
    companies,
    totalCompanyCount,
    selectedCountries,
    countryOptions,
    sortOrder,
    riskMap = new Map(),
    exportedAt = new Date(),
}: CompaniesReportInput): ReportWorkbook {
    return {
        fileName: `companies-report-${year}`,
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
                    companies,
                    totalCompanyCount,
                    selectedCountries,
                    countryOptions,
                    sortOrder,
                    riskMap,
                    exportedAt,
                }),
            },
            {
                name: '회사별 현황',
                columns: [
                    { key: 'rank', header: '순서', width: 8 },
                    { key: 'companyName', header: '회사', width: 26 },
                    { key: 'countryCode', header: '국가 코드', width: 12 },
                    { key: 'countryName', header: '국가명', width: 18 },
                    { key: 'year', header: '기준 연도', width: 12 },
                    { key: 'pcfTotalKgCo2e', header: '연간 PCF(kgCO2e)', width: 20 },
                    { key: 'activityRecordCount', header: '활동 데이터(건)', width: 16 },
                    { key: 'ghgEmissionsTco2e', header: 'GHG 배출량(tCO2e)', width: 20 },
                    { key: 'requiredAllowances', header: '필요 배출권(개)', width: 18 },
                    { key: 'estimatedAllowanceCostKrw', header: '예상 배출권 비용(원)', width: 22 },
                    { key: 'riskLevel', header: '리스크 등급', width: 14 },
                    { key: 'riskScore', header: '리스크 점수', width: 14 },
                    { key: 'pcfScope1KgCo2e', header: 'PCF Scope 1(kgCO2e)', width: 22 },
                    { key: 'pcfScope2KgCo2e', header: 'PCF Scope 2(kgCO2e)', width: 22 },
                    { key: 'pcfScope3KgCo2e', header: 'PCF Scope 3(kgCO2e)', width: 22 },
                    { key: 'dominantPcfScope', header: '주요 PCF Scope', width: 16 },
                    { key: 'dominantPcfScopePct', header: '주요 PCF Scope 비중(%)', width: 22 },
                    { key: 'riskReasons', header: '리스크 주요 정보', width: 64 },
                ],
                rows: buildCompanyRows({ year, companies, countryOptions, riskMap }),
            },
        ],
    };
}

function buildSummaryRows({
    year,
    companies,
    totalCompanyCount,
    selectedCountries,
    countryOptions,
    sortOrder,
    riskMap,
    exportedAt,
}: CompaniesReportInput & { exportedAt: Date }): ReportRow[] {
    const visibleRisks = companies
        .map((company) => riskMap?.get(company.id))
        .filter((assessment): assessment is RiskAssessment => Boolean(assessment));
    const totalPcf = round4(companies.reduce((sum, company) => sum + company.total, 0));
    const totalGhg = companies.reduce(
        (sum, company) => sum + sumEmissions(filterByYear(company.emissions, year)),
        0
    );
    const averageRiskScore =
        visibleRisks.length > 0
            ? Math.round(
                  visibleRisks.reduce((sum, assessment) => sum + assessment.score, 0) /
                      visibleRisks.length
              )
            : null;

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
            description: '회사 목록 페이지에서 선택한 연도입니다.',
        },
        {
            item: '국가 필터',
            value: getCountryFilterLabel(selectedCountries, countryOptions),
            unit: null,
            description: '회사 목록 페이지의 현재 국가 필터입니다.',
        },
        {
            item: '정렬',
            value: SORT_LABELS[sortOrder],
            unit: null,
            description: '회사 목록 페이지의 현재 정렬 기준입니다.',
        },
        {
            item: '전체 회사 수',
            value: totalCompanyCount,
            unit: '개',
            description: '필터 적용 전 등록된 관리 대상 회사 수입니다.',
        },
        {
            item: '보고서 포함 회사 수',
            value: companies.length,
            unit: '개',
            description: '현재 국가/연도/정렬 조건을 반영한 회사 수입니다.',
        },
        {
            item: '연간 PCF 합계',
            value: totalPcf,
            unit: 'kgCO2e',
            description: '보고서 포함 회사의 선택 연도 활동 데이터 기반 PCF 합계입니다.',
        },
        {
            item: '연간 GHG 집계 배출량',
            value: totalGhg,
            unit: 'tCO2e',
            description: '보고서 포함 회사의 선택 연도 GHG 배출량 합계입니다.',
        },
        {
            item: 'PCF 데이터 보유 회사',
            value: companies.filter((company) => company.activityRecords.length > 0).length,
            unit: '개',
            description: '선택 연도 활동 데이터가 있는 회사 수입니다.',
        },
        {
            item: 'High Risk 회사',
            value: visibleRisks.filter((assessment) => assessment.level === 'high').length,
            unit: '개',
            description: '현재 보고서 포함 회사 중 리스크 등급이 High인 회사 수입니다.',
        },
        {
            item: '평균 리스크 점수',
            value: averageRiskScore,
            unit: '점',
            description: '현재 보고서 포함 회사의 평균 리스크 점수입니다.',
        },
    ];
}

function buildCompanyRows({
    year,
    companies,
    countryOptions,
    riskMap,
}: Pick<CompaniesReportInput, 'year' | 'companies' | 'countryOptions' | 'riskMap'>): ReportRow[] {
    return companies.map((company, index) => {
        const riskAssessment = riskMap?.get(company.id);
        const pcfScopes = getPcfScopeTotals(company.activityRecords);
        const dominantPcfScope = getDominantScope(pcfScopes);

        return {
            rank: index + 1,
            companyName: company.name,
            countryCode: company.country,
            countryName: getCountryName(company.country, countryOptions),
            year,
            pcfTotalKgCo2e: company.total,
            activityRecordCount: company.activityRecords.length,
            ghgEmissionsTco2e: sumEmissions(filterByYear(company.emissions, year)),
            requiredAllowances: riskAssessment?.requiredAllowances ?? null,
            estimatedAllowanceCostKrw: riskAssessment?.estimatedAllowanceCostKrw ?? null,
            riskLevel: riskAssessment ? RISK_LEVEL_LABELS[riskAssessment.level] : null,
            riskScore: riskAssessment?.score ?? null,
            pcfScope1KgCo2e: pcfScopes[1],
            pcfScope2KgCo2e: pcfScopes[2],
            pcfScope3KgCo2e: pcfScopes[3],
            dominantPcfScope: dominantPcfScope ? SCOPE_LABELS[dominantPcfScope.scope] : null,
            dominantPcfScopePct: dominantPcfScope?.pct ?? null,
            riskReasons: riskAssessment?.reasons.join(' / ') ?? null,
        };
    });
}

function getCountryFilterLabel(
    selectedCountries: string[],
    countryOptions: CompaniesReportCountryOption[]
): string {
    if (selectedCountries.length === 0) return '전체 국가';
    return selectedCountries.map((code) => getCountryName(code, countryOptions)).join(', ');
}

function getCountryName(code: string, countryOptions: CompaniesReportCountryOption[]): string {
    const country = countryOptions.find((option) => option.code === code);
    return country ? `${country.name} (${code})` : code;
}

function getDominantScope(
    totals: Record<1 | 2 | 3, number>
): { scope: 1 | 2 | 3; pct: number } | null {
    const total = totals[1] + totals[2] + totals[3];
    if (total <= 0) return null;

    const scope = ([1, 2, 3] as const).reduce((current, next) =>
        totals[next] > totals[current] ? next : current
    );

    return { scope, pct: round1((totals[scope] / total) * 100) };
}

function round1(value: number) {
    return Number(value.toFixed(1));
}

function round4(value: number) {
    return Number(value.toFixed(4));
}

