import { describe, expect, it } from 'vitest';
import type { RiskAssessment, RiskSummary } from '@/lib/risk';
import { buildRiskReportWorkbook } from './risk-report';

const riskSummaryFixture: RiskSummary = {
    totalRequiredAllowances: 124,
    totalAllowanceCostKrw: 3_044_200,
    highRiskCount: 1,
    averageScore: 76,
    increasingCompaniesCount: 1,
    improvingCount: 0,
};

const emptyRiskSummary: RiskSummary = {
    totalRequiredAllowances: 0,
    totalAllowanceCostKrw: 0,
    highRiskCount: 0,
    averageScore: 0,
    increasingCompaniesCount: 0,
    improvingCount: 0,
};

const riskAssessmentsFixture: RiskAssessment[] = [
    {
        id: 'hanaloop-logistics',
        name: 'Hanaloop Logistics',
        country: 'KR',
        annualEmissions: 123,
        requiredAllowances: 124,
        allowancePriceKrw: 24550,
        estimatedAllowanceCostKrw: 3_044_200,
        recentTrendPct: 12.5,
        dominantScope: 3,
        dominantScopePct: 88.2,
        score: 76,
        level: 'high',
        reasons: [
            '연간 배출량이 관리 대상 중 상위권입니다.',
            'Scope 3 비중이 높아 공급망·운송 관리 난이도가 큽니다.',
        ],
    },
];

describe('buildRiskReportWorkbook', () => {
    it('리스크 페이지 요약과 관리 우선순위 시트를 생성한다', () => {
        const workbook = buildRiskReportWorkbook({
            year: 2024,
            totalCompanies: 1,
            summary: riskSummaryFixture,
            assessments: riskAssessmentsFixture,
            exportedAt: new Date(2024, 0, 2, 3, 4),
        });

        expect(workbook.fileName).toBe('risk-report-2024');
        expect(workbook.sheets.map((sheet) => sheet.name)).toEqual(['요약', '관리 우선순위']);
        expect(workbook.sheets[0].columns.map((column) => column.header)).toEqual([
            '항목',
            '값',
            '단위',
            '설명',
        ]);
        expect(workbook.sheets[1].columns.map((column) => column.header)).toEqual([
            '순위',
            '회사',
            '국가',
            '리스크 등급',
            '점수',
            '연간 배출량(tCO2e)',
            '필요 배출권(개)',
            '배출권 단가(원/개)',
            '예상 배출권 비용(원)',
            '최근 추세(%)',
            '주요 Scope',
            '주요 Scope 비중(%)',
            '주요 정보',
        ]);

        expect(workbook.sheets[0].rows).toContainEqual({
            item: '총 필요 배출권',
            value: 124,
            unit: '개',
            description: '1 tCO2e를 배출권 1개로 보고 연간 배출량을 올림 환산했습니다.',
        });
        expect(workbook.sheets[0].rows).toContainEqual({
            item: '가정 배출권 단가',
            value: 24550,
            unit: '원/배출권',
            description: '선택 연도 단가 조회값 또는 기본 폴백값입니다.',
        });

        expect(workbook.sheets[1].rows[0]).toEqual({
            rank: 1,
            companyName: 'Hanaloop Logistics',
            country: 'KR',
            riskLevel: 'High',
            score: 76,
            annualEmissions: 123,
            requiredAllowances: 124,
            allowancePriceKrw: 24550,
            estimatedAllowanceCostKrw: 3_044_200,
            recentTrendPct: 12.5,
            dominantScope: 'Scope 3',
            dominantScopePct: 88.2,
            reasons:
                '연간 배출량이 관리 대상 중 상위권입니다. / Scope 3 비중이 높아 공급망·운송 관리 난이도가 큽니다.',
        });
    });

    it('빈 리스크 데이터에서도 요약 시트와 빈 우선순위 시트를 유지한다', () => {
        const workbook = buildRiskReportWorkbook({
            year: 2026,
            totalCompanies: 0,
            summary: emptyRiskSummary,
            assessments: [],
            exportedAt: new Date(2026, 0, 1, 9, 30),
        });

        expect(workbook.fileName).toBe('risk-report-2026');
        expect(workbook.sheets.map((sheet) => sheet.name)).toEqual(['요약', '관리 우선순위']);
        expect(workbook.sheets[1].rows).toEqual([]);
        expect(workbook.sheets[0].rows).toContainEqual({
            item: '관리 대상 회사 수',
            value: 0,
            unit: '개',
            description: '현재 등록된 관리 대상 회사 수입니다.',
        });
        expect(workbook.sheets[0].rows).toContainEqual({
            item: '가정 배출권 단가',
            value: null,
            unit: '원/배출권',
            description: '선택 연도 단가 조회값 또는 기본 폴백값입니다.',
        });
    });
});
