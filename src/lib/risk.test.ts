import { describe, expect, it } from 'vitest';
import { ALLOWANCE_PRICE_KRW_PER_TCO2E } from '@/constants/risk';
import type { Company } from '@/types';
import { getRiskAssessments, getRiskSummary } from './risk';

const riskCompaniesFixture: Company[] = [
    {
        id: 'high-scope3',
        name: 'High Scope 3 Logistics',
        country: 'SG',
        emissions: [
            { yearMonth: '2024-01', source: 'shipping', emissions: 100 },
            { yearMonth: '2024-02', source: 'shipping', emissions: 100 },
            { yearMonth: '2024-03', source: 'shipping', emissions: 100 },
            { yearMonth: '2024-04', source: 'shipping', emissions: 130 },
            { yearMonth: '2024-05', source: 'shipping', emissions: 130 },
            { yearMonth: '2024-06', source: 'shipping', emissions: 130 },
        ],
    },
    {
        id: 'medium-scope2',
        name: 'Medium Scope 2 Factory',
        country: 'KR',
        emissions: [{ yearMonth: '2024-01', source: 'electricity', emissions: 500 }],
    },
    {
        id: 'low-balanced',
        name: 'Low Balanced Office',
        country: 'NO',
        emissions: [
            { yearMonth: '2024-01', source: 'diesel', emissions: 30 },
            { yearMonth: '2024-01', source: 'electricity', emissions: 30 },
            { yearMonth: '2024-01', source: 'shipping', emissions: 30 },
        ],
    },
];

describe('risk utilities', () => {
    it('배출량·최근 추세·Scope 구성으로 리스크 점수와 등급을 산정한다', () => {
        const assessments = getRiskAssessments(riskCompaniesFixture, 2024);

        expect(assessments.map((item) => item.id)).toEqual([
            'high-scope3',
            'medium-scope2',
            'low-balanced',
        ]);

        expect(assessments[0]).toMatchObject({
            id: 'high-scope3',
            annualEmissions: 690,
            estimatedAllowanceCostKrw: 690 * ALLOWANCE_PRICE_KRW_PER_TCO2E,
            dominantScope: 3,
            dominantScopePct: 100,
            score: 100,
            level: 'high',
        });
        expect(assessments[0].recentTrendPct).toBeCloseTo(30, 2);
        expect(assessments[0].reasons).toEqual([
            '연간 배출량이 관리 대상 중 상위권입니다.',
            '최근 3개월 평균 배출량이 이전 기간 대비 30.0% 증가했습니다.',
            'Scope 3 비중이 높아 공급망·운송 관리 난이도가 큽니다.',
        ]);

        expect(assessments[1]).toMatchObject({
            id: 'medium-scope2',
            annualEmissions: 500,
            estimatedAllowanceCostKrw: 500 * ALLOWANCE_PRICE_KRW_PER_TCO2E,
            dominantScope: 2,
            dominantScopePct: 100,
            score: 48,
            level: 'medium',
        });
        expect(assessments[1].recentTrendPct).toBeNull();
        expect(assessments[1].reasons).toEqual([
            'Scope 2 비중이 높아 전력 사용과 재생에너지 전환 검토가 필요합니다.',
        ]);

        expect(assessments[2]).toMatchObject({
            id: 'low-balanced',
            annualEmissions: 90,
            estimatedAllowanceCostKrw: 90 * ALLOWANCE_PRICE_KRW_PER_TCO2E,
            dominantScope: 1,
            score: 13,
            level: 'low',
        });
        expect(assessments[2].dominantScopePct).toBeCloseTo(33.33, 2);
        expect(assessments[2].recentTrendPct).toBeNull();
        expect(assessments[2].reasons).toEqual([
            '현재 기준 리스크는 상대적으로 낮지만 정기 모니터링이 필요합니다.',
        ]);
    });

    it('리스크 KPI 요약값을 관리 대상 전체 기준으로 집계한다', () => {
        const assessments = getRiskAssessments(riskCompaniesFixture, 2024);

        expect(getRiskSummary(assessments)).toEqual({
            totalAllowanceCostKrw: 64_000_000,
            highRiskCount: 1,
            averageScore: 54,
            increasingCompaniesCount: 1,
            improvingCount: 0,
        });
    });

    it('배출권 단가 시나리오를 인자로 받아 구매비용을 재계산한다', () => {
        const [highRisk] = getRiskAssessments(riskCompaniesFixture, 2024, 1_000);

        expect(highRisk.estimatedAllowanceCostKrw).toBe(690_000);
    });

    it('선택 연도 이후의 배출 데이터는 해당 연도 최근 추세 계산에서 제외한다', () => {
        const [assessment] = getRiskAssessments(
            [
                {
                    ...riskCompaniesFixture[0],
                    emissions: [
                        ...riskCompaniesFixture[0].emissions,
                        { yearMonth: '2025-01', source: 'shipping', emissions: 10 },
                    ],
                },
            ],
            2024
        );

        expect(assessment.recentTrendPct).toBeCloseTo(30, 2);
        expect(assessment.level).toBe('high');
    });

    it('선택 연도에 배출량이 없으면 0원 노출액과 낮은 리스크로 처리한다', () => {
        const [assessment] = getRiskAssessments([riskCompaniesFixture[0]], 2025);

        expect(assessment).toMatchObject({
            id: 'high-scope3',
            annualEmissions: 0,
            estimatedAllowanceCostKrw: 0,
            recentTrendPct: 30,
            dominantScope: null,
            dominantScopePct: 0,
            score: 35,
            level: 'low',
            reasons: ['선택 연도에 집계된 배출량이 없습니다.'],
        });
    });

    it('빈 리스크 목록의 요약값은 0 기준으로 반환한다', () => {
        expect(getRiskSummary([])).toEqual({
            totalAllowanceCostKrw: 0,
            highRiskCount: 0,
            averageScore: 0,
            increasingCompaniesCount: 0,
            improvingCount: 0,
        });
    });
});
