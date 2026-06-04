import { describe, expect, it } from 'vitest';
import type { RiskAssessment } from '@/lib/risk';
import type { ActivityRecord, Company, Post } from '@/types';
import { buildCompanyDetailReportWorkbook } from './company-detail-report';

const companyFixture: Company = {
    id: 'company-1',
    name: 'Hanaloop Manufacturing',
    country: 'KR',
    emissions: [
        { yearMonth: '2024-01', source: 'electricity', emissions: 10 },
        { yearMonth: '2024-02', source: 'shipping', emissions: 20 },
        { yearMonth: '2023-01', source: 'diesel', emissions: 99 },
    ],
};

const activityRecordsFixture: ActivityRecord[] = [
    {
        id: 'record-1',
        companyId: 'company-1',
        emissionFactorId: 'factor-1',
        activityDate: '2024-01-15',
        yearMonth: '2024-01',
        activityType: '전력',
        description: '공장 전력 사용량',
        quantity: 100,
        unit: 'kWh',
        source: 'electricity',
        scope: 2,
        emissionFactorKg: 5,
        emissionsKg: 500,
        emissionsTco2e: 0.5,
        importFileName: 'activity.xlsx',
        importRowNumber: 2,
        createdAt: '2024-02-01 10:00',
    },
    {
        id: 'record-2',
        companyId: 'company-1',
        emissionFactorId: 'factor-2',
        activityDate: '2024-02-15',
        yearMonth: '2024-02',
        activityType: '운송',
        description: '해운 물류',
        quantity: 4,
        unit: 'trip',
        source: 'shipping',
        scope: 3,
        emissionFactorKg: 500,
        emissionsKg: 2000,
        emissionsTco2e: 2,
        importFileName: 'activity.xlsx',
        importRowNumber: 3,
        createdAt: '2024-03-01 10:00',
    },
    {
        id: 'record-2023',
        companyId: 'company-1',
        emissionFactorId: 'factor-3',
        activityDate: '2023-01-15',
        yearMonth: '2023-01',
        activityType: '연료',
        description: '전년도 데이터',
        quantity: 1,
        unit: 'L',
        source: 'diesel',
        scope: 1,
        emissionFactorKg: 10,
        emissionsKg: 10,
        emissionsTco2e: 0.01,
        importFileName: null,
        importRowNumber: null,
        createdAt: '2023-02-01 10:00',
    },
];

const actionNotesFixture: Post[] = [
    {
        id: 'note-2',
        resourceUid: 'company-1',
        title: '두 번째 메모',
        dateTime: '2024-02-01 09:00',
        author: '이하나',
        content: '운송 배출량 감축 검토',
    },
    {
        id: 'note-other',
        resourceUid: 'company-2',
        title: '다른 회사 메모',
        dateTime: '2024-01-01 09:00',
        author: '김담당',
        content: '포함되면 안 됨',
    },
    {
        id: 'note-1',
        resourceUid: 'company-1',
        title: '첫 번째 메모',
        dateTime: '2024-01-20 09:00',
        author: '김담당',
        content: '전력 사용량 확인',
    },
];

const riskAssessmentFixture: RiskAssessment = {
    id: 'company-1',
    name: 'Hanaloop Manufacturing',
    country: 'KR',
    annualEmissions: 30,
    requiredAllowances: 30,
    allowancePriceKrw: 24550,
    estimatedAllowanceCostKrw: 736500,
    recentTrendPct: null,
    dominantScope: 3,
    dominantScopePct: 66.7,
    score: 72,
    level: 'high',
    reasons: ['운송 배출 비중이 높습니다.'],
};

describe('buildCompanyDetailReportWorkbook', () => {
    it('선택 연도 회사 상세 데이터를 6개 시트로 변환한다', () => {
        const workbook = buildCompanyDetailReportWorkbook({
            company: companyFixture,
            year: 2024,
            activityRecords: activityRecordsFixture,
            actionNotes: actionNotesFixture,
            riskAssessment: riskAssessmentFixture,
            riskRank: 2,
            riskTotal: 5,
            exportedAt: new Date(2024, 0, 2, 3, 4),
        });

        expect(workbook.fileName).toBe('company-detail-Hanaloop Manufacturing-2024');
        expect(workbook.sheets.map((sheet) => sheet.name)).toEqual([
            '요약',
            '월별 배출량',
            'Scope별 배출',
            '배출원별 배출',
            '활동 데이터',
            'Action Notes',
        ]);

        expect(workbook.sheets[0].rows).toContainEqual({
            item: '연간 GHG 집계 배출량',
            value: 30,
            unit: 'tCO2e',
            description: '선택 연도 GHG 배출량 합계입니다.',
        });
        expect(workbook.sheets[0].rows).toContainEqual({
            item: 'Action Notes 수',
            value: 2,
            unit: '건',
            description: '회사에 작성된 Action Notes 전체 건수입니다.',
        });

        expect(workbook.sheets[1].rows).toEqual([
            {
                month: '2024-01',
                ghgScope1Tco2e: 0,
                ghgScope2Tco2e: 10,
                ghgScope3Tco2e: 0,
                ghgTotalTco2e: 10,
                pcfScope1KgCo2e: 0,
                pcfScope2KgCo2e: 500,
                pcfScope3KgCo2e: 0,
                pcfTotalKgCo2e: 500,
            },
            {
                month: '2024-02',
                ghgScope1Tco2e: 0,
                ghgScope2Tco2e: 0,
                ghgScope3Tco2e: 20,
                ghgTotalTco2e: 20,
                pcfScope1KgCo2e: 0,
                pcfScope2KgCo2e: 0,
                pcfScope3KgCo2e: 2000,
                pcfTotalKgCo2e: 2000,
            },
        ]);

        expect(workbook.sheets[3].rows[0]).toMatchObject({
            sourceCode: 'shipping',
            sourceName: '해운',
            scope: 'Scope 3',
            ghgEmissionsTco2e: 20,
            pcfEmissionsKgCo2e: 2000,
        });
        expect(workbook.sheets[4].rows).toHaveLength(2);
        expect(workbook.sheets[5].rows.map((row) => row.title)).toEqual([
            '첫 번째 메모',
            '두 번째 메모',
        ]);
    });
});
