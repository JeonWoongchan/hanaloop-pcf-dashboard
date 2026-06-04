import { SCOPE_LABELS } from '@/constants/ghg-scope';
import { RISK_LEVEL_LABELS } from '@/constants/risk';
import type { RiskAssessment, RiskSummary } from '@/lib/risk';
import type { ReportWorkbook } from '../types';

export type RiskReportInput = {
    year: number;
    totalCompanies: number;
    summary: RiskSummary;
    assessments: RiskAssessment[];
    exportedAt?: Date;
};

export function buildRiskReportWorkbook({
    year,
    totalCompanies,
    summary,
    assessments,
    exportedAt = new Date(),
}: RiskReportInput): ReportWorkbook {
    const allowancePriceKrw = assessments[0]?.allowancePriceKrw ?? null;

    return {
        fileName: `risk-report-${year}`,
        sheets: [
            {
                name: '요약',
                columns: [
                    { key: 'item', header: '항목', width: 24 },
                    { key: 'value', header: '값', width: 18 },
                    { key: 'unit', header: '단위', width: 14 },
                    { key: 'description', header: '설명', width: 56 },
                ],
                rows: [
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
                        description: '리스크 관리 페이지에서 선택한 연도입니다.',
                    },
                    {
                        item: '관리 대상 회사 수',
                        value: totalCompanies,
                        unit: '개',
                        description: '현재 등록된 관리 대상 회사 수입니다.',
                    },
                    {
                        item: '총 필요 배출권',
                        value: summary.totalRequiredAllowances,
                        unit: '개',
                        description: '1 tCO2e를 배출권 1개로 보고 연간 배출량을 올림 환산했습니다.',
                    },
                    {
                        item: '예상 배출권 구매비용',
                        value: summary.totalAllowanceCostKrw,
                        unit: '원',
                        description: '필요 배출권 수량에 선택 연도 배출권 단가를 곱한 금액입니다.',
                    },
                    {
                        item: 'High Risk 회사',
                        value: summary.highRiskCount,
                        unit: '개',
                        description: '리스크 점수 70점 이상인 우선 검토 대상 회사입니다.',
                    },
                    {
                        item: '평균 리스크 점수',
                        value: summary.averageScore,
                        unit: '점',
                        description: '관리 대상 회사의 평균 리스크 점수입니다.',
                    },
                    {
                        item: '증가 추세 회사',
                        value: summary.increasingCompaniesCount,
                        unit: '개',
                        description: '최근 추세가 0%보다 큰 회사 수입니다.',
                    },
                    {
                        item: '감소 추세 회사',
                        value: summary.improvingCount,
                        unit: '개',
                        description: '최근 추세가 0%보다 작은 회사 수입니다.',
                    },
                    {
                        item: '가정 배출권 단가',
                        value: allowancePriceKrw,
                        unit: '원/배출권',
                        description: '선택 연도 단가 조회값 또는 기본 폴백값입니다.',
                    },
                    {
                        item: '배출권 환산 기준',
                        value: '1 tCO2e = 배출권 1개',
                        unit: null,
                        description:
                            '무상할당량과 보유 배출권은 반영하지 않은 총 필요량 기준입니다.',
                    },
                ],
            },
            {
                name: '관리 우선순위',
                columns: [
                    { key: 'rank', header: '순위', width: 8 },
                    { key: 'companyName', header: '회사', width: 24 },
                    { key: 'country', header: '국가', width: 10 },
                    { key: 'riskLevel', header: '리스크 등급', width: 14 },
                    { key: 'score', header: '점수', width: 10 },
                    { key: 'annualEmissions', header: '연간 배출량(tCO2e)', width: 18 },
                    { key: 'requiredAllowances', header: '필요 배출권(개)', width: 18 },
                    { key: 'allowancePriceKrw', header: '배출권 단가(원/개)', width: 20 },
                    { key: 'estimatedAllowanceCostKrw', header: '예상 배출권 비용(원)', width: 22 },
                    { key: 'recentTrendPct', header: '최근 추세(%)', width: 14 },
                    { key: 'dominantScope', header: '주요 Scope', width: 14 },
                    { key: 'dominantScopePct', header: '주요 Scope 비중(%)', width: 20 },
                    { key: 'reasons', header: '주요 정보', width: 64 },
                ],
                rows: assessments.map((assessment, index) => ({
                    rank: index + 1,
                    companyName: assessment.name,
                    country: assessment.country,
                    riskLevel: RISK_LEVEL_LABELS[assessment.level],
                    score: assessment.score,
                    annualEmissions: assessment.annualEmissions,
                    requiredAllowances: assessment.requiredAllowances,
                    allowancePriceKrw: assessment.allowancePriceKrw,
                    estimatedAllowanceCostKrw: assessment.estimatedAllowanceCostKrw,
                    recentTrendPct: assessment.recentTrendPct,
                    dominantScope: getDominantScopeLabel(assessment),
                    dominantScopePct: assessment.dominantScope ? assessment.dominantScopePct : null,
                    reasons: assessment.reasons.join(' / '),
                })),
            },
        ],
    };
}

function getDominantScopeLabel(assessment: RiskAssessment): string | null {
    return assessment.dominantScope ? SCOPE_LABELS[assessment.dominantScope] : null;
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
