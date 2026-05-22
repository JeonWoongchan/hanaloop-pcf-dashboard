import { describe, expect, it } from 'vitest';
import {
    TOTAL_EMISSIONS_KEY,
    filterByYear,
    getAnnualTotals,
    getAvailableYears,
    getCompanyScatterPoints,
    getCompanyTotalsForSource,
    getMergedMonthlyData,
    getMomYoyChange,
    getMonthlyByCompany,
    getMonthlyByScope,
    getMonthlyTotals,
    getMonthlyTotalsBySource,
    getScopeBreakdown,
    getScopeTotals,
    getSelectedYear,
    getTotalByCompany,
    getTotalBySource,
    getYoyChange,
    sumEmissions,
} from './emissions';
import type { Company, GhgEmission } from '@/types';

const emissionsFixture: GhgEmission[] = [
    { yearMonth: '2023-12', source: 'naturalGas', emissions: 5 },
    { yearMonth: '2024-01', source: 'diesel', emissions: 10.2 },
    { yearMonth: '2024-01', source: 'electricity', emissions: 20.3 },
    { yearMonth: '2024-02', source: 'shipping', emissions: 30.4 },
    { yearMonth: '2024-02', source: 'unknownFuel', emissions: 4.1 },
    { yearMonth: '2025-01', source: 'heat', emissions: 40 },
];

const companyA: Company = {
    id: 'a',
    name: 'Alpha Manufacturing',
    country: 'KR',
    emissions: [
        { yearMonth: '2024-01', source: 'diesel', emissions: 10.2 },
        { yearMonth: '2024-01', source: 'electricity', emissions: 20.3 },
        { yearMonth: '2024-02', source: 'shipping', emissions: 30.4 },
    ],
};

const companyB: Company = {
    id: 'b',
    name: 'Beta Logistics',
    country: 'US',
    emissions: [
        { yearMonth: '2024-01', source: 'diesel', emissions: 9.5 },
        { yearMonth: '2024-03', source: 'electricity', emissions: 40.2 },
    ],
};

describe('emissions utilities', () => {
    it('배출량 합계를 tCO₂e 표시 기준에 맞게 반올림한다', () => {
        expect(sumEmissions([
            { yearMonth: '2024-01', source: 'diesel', emissions: 10.4 },
            { yearMonth: '2024-01', source: 'electricity', emissions: 20.4 },
            { yearMonth: '2024-01', source: 'shipping', emissions: 0.4 },
        ])).toBe(31);
    });

    it('연도 필터와 선택 가능한 연도 목록을 계산한다', () => {
        expect(filterByYear(emissionsFixture, 2024)).toHaveLength(4);
        expect(getAvailableYears(emissionsFixture)).toEqual([2025, 2024, 2023]);
        expect(getSelectedYear(2024, [2025, 2024, 2023])).toBe(2024);
        expect(getSelectedYear(2022, [2025, 2024, 2023])).toBe(2025);
    });

    it('연도별 총 배출량을 오래된 연도부터 정렬한다', () => {
        expect(getAnnualTotals(emissionsFixture)).toEqual([
            { year: 2023, total: 5 },
            { year: 2024, total: 65 },
            { year: 2025, total: 40 },
        ]);
    });

    it('GHG Scope별 합계와 비중을 계산하고 미등록 source는 Scope 3으로 분류한다', () => {
        const targetYear = filterByYear(emissionsFixture, 2024);

        expect(getScopeTotals(targetYear)).toEqual({
            1: 10.2,
            2: 20.3,
            3: 34.5,
        });

        const breakdown = getScopeBreakdown(targetYear);
        expect(breakdown.find((item) => item.scope === 1)?.pct).toBeCloseTo(15.69, 2);
        expect(breakdown.find((item) => item.scope === 2)?.pct).toBeCloseTo(31.23, 2);
        expect(breakdown.find((item) => item.scope === 3)?.pct).toBeCloseTo(53.08, 2);
    });

    it('월별 Scope wide format을 차트 입력 형태로 만든다', () => {
        expect(getMonthlyByScope(filterByYear(emissionsFixture, 2024))).toEqual([
            { month: '2024-01', 'Scope 1': 10, 'Scope 2': 20, 'Scope 3': 0 },
            { month: '2024-02', 'Scope 1': 0, 'Scope 2': 0, 'Scope 3': 35 },
        ]);
    });

    it('배출원별 합계를 내림차순으로 정렬하고 Scope 정보를 붙인다', () => {
        expect(getTotalBySource(filterByYear(emissionsFixture, 2024))).toEqual([
            { source: 'shipping', total: 30, scope: 3 },
            { source: 'electricity', total: 20, scope: 2 },
            { source: 'diesel', total: 10, scope: 1 },
            { source: 'unknownFuel', total: 4, scope: 3 },
        ]);
    });

    it('회사별·월별 합계를 정렬된 차트 데이터로 만든다', () => {
        expect(getMonthlyTotals([companyA, companyB])).toEqual([
            { month: '2024-01', total: 40 },
            { month: '2024-02', total: 30 },
            { month: '2024-03', total: 40 },
        ]);

        expect(getMonthlyByCompany([companyA, companyB])).toEqual([
            { month: '2024-01', 'Alpha Manufacturing': 31, 'Beta Logistics': 10 },
            { month: '2024-02', 'Alpha Manufacturing': 30, 'Beta Logistics': 0 },
            { month: '2024-03', 'Alpha Manufacturing': 0, 'Beta Logistics': 40 },
        ]);

        expect(getTotalByCompany([companyA, companyB])).toEqual([
            { id: 'a', name: 'Alpha Manufacturing', country: 'KR', total: 61 },
            { id: 'b', name: 'Beta Logistics', country: 'US', total: 50 },
        ]);
    });

    it('월별 회사 데이터와 전체 합산을 month 키 기준으로 병합한다', () => {
        expect(getMergedMonthlyData(
            [
                { month: '2024-02', 'Alpha Manufacturing': 30 },
                { month: '2024-01', 'Alpha Manufacturing': 31 },
            ],
            [
                { month: '2024-01', total: 40 },
                { month: '2024-02', total: 30 },
            ]
        )).toEqual([
            { month: '2024-02', 'Alpha Manufacturing': 30, [TOTAL_EMISSIONS_KEY]: 30 },
            { month: '2024-01', 'Alpha Manufacturing': 31, [TOTAL_EMISSIONS_KEY]: 40 },
        ]);
    });

    it('전년 동기간 및 최신 월 전년 동월 대비 변화율을 계산한다', () => {
        const allEmissions: GhgEmission[] = [
            { yearMonth: '2023-01', source: 'diesel', emissions: 50 },
            { yearMonth: '2023-02', source: 'diesel', emissions: 100 },
            { yearMonth: '2023-03', source: 'diesel', emissions: 999 },
            { yearMonth: '2024-01', source: 'diesel', emissions: 100 },
            { yearMonth: '2024-02', source: 'diesel', emissions: 200 },
        ];
        const monthlyTotals = [
            { month: '2024-01', total: 100 },
            { month: '2024-02', total: 200 },
        ];

        expect(getYoyChange(allEmissions, monthlyTotals)).toBe(100);
        expect(getMomYoyChange(allEmissions, monthlyTotals[1])).toBe(100);
    });

    it('배출원 드릴다운과 산포도용 파생 데이터를 생성한다', () => {
        const companies: Company[] = [
            {
                id: 'scatter-a',
                name: 'Scatter A',
                country: 'KR',
                emissions: [
                    { yearMonth: '2024-01', source: 'diesel', emissions: 10 },
                    { yearMonth: '2024-01', source: 'electricity', emissions: 20 },
                    { yearMonth: '2024-01', source: 'shipping', emissions: 70 },
                ],
            },
            {
                id: 'scatter-b',
                name: 'Scatter B',
                country: 'US',
                emissions: [
                    { yearMonth: '2024-01', source: 'shipping', emissions: 30 },
                    { yearMonth: '2025-01', source: 'shipping', emissions: 300 },
                ],
            },
        ];

        expect(getCompanyTotalsForSource(companies, 'shipping', 2024)).toEqual([
            { id: 'scatter-a', name: 'Scatter A', country: 'KR', total: 70 },
            { id: 'scatter-b', name: 'Scatter B', country: 'US', total: 30 },
        ]);
        expect(getMonthlyTotalsBySource(companies[0].emissions, 'shipping')).toEqual([
            { month: '2024-01', total: 70 },
        ]);

        const [point] = getCompanyScatterPoints([companies[0]], 2024);
        expect(point).toMatchObject({
            id: 'scatter-a',
            name: 'Scatter A',
            total: 100,
            dominantScope: 3,
            topSourcePct: 70,
        });
        expect(point.s1Pct).toBeCloseTo(10, 2);
        expect(point.s2Pct).toBeCloseTo(20, 2);
        expect(point.s3Pct).toBeCloseTo(70, 2);
    });
});
