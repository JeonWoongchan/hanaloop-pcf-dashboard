import { describe, expect, it } from 'vitest';
import { buildSourcesReportWorkbook } from './sources-report';

describe('buildSourcesReportWorkbook', () => {
    it('현재 선택 연도와 선택 배출원을 반영한 배출원 분석 보고서를 생성한다', () => {
        const workbook = buildSourcesReportWorkbook({
            year: 2024,
            allSources: [
                { source: 'shipping', total: 100, scope: 3 },
                { source: 'diesel', total: 70, scope: 1 },
                { source: 'electricity', total: 40, scope: 2 },
            ],
            activeSource: { source: 'diesel', total: 70, scope: 1 },
            scopeTotals: { 1: 70, 2: 40, 3: 100 },
            companyBreakdown: [
                { id: 'beta', name: 'Beta', country: 'US', total: 60 },
                { id: 'alpha', name: 'Alpha', country: 'KR', total: 10 },
            ],
            monthlyTrend: [
                { month: '2024-01', total: 10 },
                { month: '2024-02', total: 60 },
            ],
            totalEmissions: 210,
            totalCompanies: 2,
            exportedAt: new Date(2024, 0, 2, 3, 4),
        });

        expect(workbook.fileName).toBe('sources-report-2024-diesel');
        expect(workbook.sheets.map((sheet) => sheet.name)).toEqual([
            '요약',
            '배출원 순위',
            '선택 배출원 월별 추이',
            '선택 배출원 회사별 기여',
        ]);

        expect(workbook.sheets[0].rows).toContainEqual({
            item: '선택 배출원',
            value: '경유',
            unit: null,
            description: '배출원 분석 페이지에서 현재 선택된 배출원입니다.',
        });
        expect(workbook.sheets[0].rows).toContainEqual({
            item: '선택 배출원 전체 비중',
            value: 33.3,
            unit: '%',
            description: '전체 배출량 중 선택 배출원이 차지하는 비중입니다.',
        });

        expect(workbook.sheets[1].rows).toEqual([
            {
                rank: 1,
                sourceCode: 'shipping',
                sourceName: '해운',
                scope: 'Scope 3',
                emissionsTco2e: 100,
                sharePct: 47.6,
                selected: '',
            },
            {
                rank: 2,
                sourceCode: 'diesel',
                sourceName: '경유',
                scope: 'Scope 1',
                emissionsTco2e: 70,
                sharePct: 33.3,
                selected: '예',
            },
            {
                rank: 3,
                sourceCode: 'electricity',
                sourceName: '전기',
                scope: 'Scope 2',
                emissionsTco2e: 40,
                sharePct: 19,
                selected: '',
            },
        ]);

        expect(workbook.sheets[2].rows).toEqual([
            {
                sourceCode: 'diesel',
                sourceName: '경유',
                scope: 'Scope 1',
                month: '2024-01',
                emissionsTco2e: 10,
            },
            {
                sourceCode: 'diesel',
                sourceName: '경유',
                scope: 'Scope 1',
                month: '2024-02',
                emissionsTco2e: 60,
            },
        ]);

        expect(workbook.sheets[3].rows[0]).toEqual({
            rank: 1,
            sourceCode: 'diesel',
            sourceName: '경유',
            scope: 'Scope 1',
            companyName: 'Beta',
            country: 'US',
            emissionsTco2e: 60,
            sourceSharePct: 85.7,
        });
    });
});
