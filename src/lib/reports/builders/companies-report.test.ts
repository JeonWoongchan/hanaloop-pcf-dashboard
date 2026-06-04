import { describe, expect, it } from 'vitest';
import type { CompanyPcfTotal } from '@/lib/emissions';
import type { RiskAssessment } from '@/lib/risk';
import type { ActivityRecord } from '@/types';
import { buildCompaniesReportWorkbook } from './companies-report';

function activityRecord(
    overrides: Partial<ActivityRecord> &
        Pick<ActivityRecord, 'id' | 'companyId' | 'yearMonth' | 'source' | 'scope' | 'emissionsKg'>
): ActivityRecord {
    return {
        emissionFactorId: null,
        activityDate: `${overrides.yearMonth}-01`,
        activityType: '활동',
        description: '테스트 활동',
        quantity: 1,
        unit: 'unit',
        emissionFactorKg: overrides.emissionsKg,
        emissionsTco2e: overrides.emissionsKg / 1000,
        importFileName: null,
        importRowNumber: null,
        createdAt: '2024-01-01 10:00',
        ...overrides,
    };
}

const companiesFixture: CompanyPcfTotal[] = [
    {
        id: 'beta',
        name: 'Beta Foods',
        country: 'KR',
        emissions: [
            { yearMonth: '2024-01', source: 'electricity', emissions: 50 },
            { yearMonth: '2023-01', source: 'diesel', emissions: 999 },
        ],
        total: 300,
        activityRecords: [
            activityRecord({
                id: 'beta-s2',
                companyId: 'beta',
                yearMonth: '2024-01',
                source: 'electricity',
                scope: 2,
                emissionsKg: 300,
            }),
        ],
    },
    {
        id: 'alpha',
        name: 'Alpha Materials',
        country: 'KR',
        emissions: [{ yearMonth: '2024-01', source: 'shipping', emissions: 80 }],
        total: 100,
        activityRecords: [
            activityRecord({
                id: 'alpha-s3',
                companyId: 'alpha',
                yearMonth: '2024-01',
                source: 'shipping',
                scope: 3,
                emissionsKg: 100,
            }),
        ],
    },
];

const riskMapFixture = new Map<string, RiskAssessment>([
    [
        'beta',
        {
            id: 'beta',
            name: 'Beta Foods',
            country: 'KR',
            annualEmissions: 50,
            requiredAllowances: 50,
            allowancePriceKrw: 24550,
            estimatedAllowanceCostKrw: 1_227_500,
            recentTrendPct: null,
            dominantScope: 2,
            dominantScopePct: 100,
            score: 48,
            level: 'medium',
            reasons: ['Scope 2 비중이 높아 전력 사용과 재생에너지 전환 검토가 필요합니다.'],
        },
    ],
    [
        'alpha',
        {
            id: 'alpha',
            name: 'Alpha Materials',
            country: 'KR',
            annualEmissions: 80,
            requiredAllowances: 80,
            allowancePriceKrw: 24550,
            estimatedAllowanceCostKrw: 1_964_000,
            recentTrendPct: null,
            dominantScope: 3,
            dominantScopePct: 100,
            score: 80,
            level: 'high',
            reasons: ['Scope 3 비중이 높아 공급망·운송 관리 난이도가 큽니다.'],
        },
    ],
]);

describe('buildCompaniesReportWorkbook', () => {
    it('현재 국가/연도/정렬 필터가 반영된 회사 목록 보고서를 생성한다', () => {
        const workbook = buildCompaniesReportWorkbook({
            year: 2024,
            companies: companiesFixture,
            totalCompanyCount: 3,
            selectedCountries: ['KR'],
            countryOptions: [
                { code: 'KR', name: '대한민국' },
                { code: 'US', name: '미국' },
            ],
            sortOrder: 'desc',
            riskMap: riskMapFixture,
            exportedAt: new Date(2024, 0, 2, 3, 4),
        });

        expect(workbook.fileName).toBe('companies-report-2024');
        expect(workbook.sheets.map((sheet) => sheet.name)).toEqual(['요약', '회사별 현황']);

        expect(workbook.sheets[0].rows).toContainEqual({
            item: '국가 필터',
            value: '대한민국 (KR)',
            unit: null,
            description: '회사 목록 페이지의 현재 국가 필터입니다.',
        });
        expect(workbook.sheets[0].rows).toContainEqual({
            item: '정렬',
            value: 'PCF 높은 순',
            unit: null,
            description: '회사 목록 페이지의 현재 정렬 기준입니다.',
        });
        expect(workbook.sheets[0].rows).toContainEqual({
            item: '보고서 포함 회사 수',
            value: 2,
            unit: '개',
            description: '현재 국가/연도/정렬 조건을 반영한 회사 수입니다.',
        });

        expect(workbook.sheets[1].rows.map((row) => row.companyName)).toEqual([
            'Beta Foods',
            'Alpha Materials',
        ]);
        expect(workbook.sheets[1].rows[0]).toMatchObject({
            rank: 1,
            companyName: 'Beta Foods',
            countryCode: 'KR',
            countryName: '대한민국 (KR)',
            year: 2024,
            pcfTotalKgCo2e: 300,
            activityRecordCount: 1,
            ghgEmissionsTco2e: 50,
            requiredAllowances: 50,
            riskLevel: 'Medium',
            riskScore: 48,
            pcfScope2KgCo2e: 300,
            dominantPcfScope: 'Scope 2',
            dominantPcfScopePct: 100,
        });
    });

    it('필터 결과가 비어도 요약과 빈 회사별 현황 시트를 생성한다', () => {
        const workbook = buildCompaniesReportWorkbook({
            year: 2026,
            companies: [],
            totalCompanyCount: 3,
            selectedCountries: [],
            countryOptions: [
                { code: 'KR', name: '대한민국' },
                { code: 'US', name: '미국' },
            ],
            sortOrder: 'name',
            exportedAt: new Date(2026, 0, 1, 9, 30),
        });

        expect(workbook.sheets.map((sheet) => sheet.name)).toEqual(['요약', '회사별 현황']);
        expect(workbook.sheets[1].rows).toEqual([]);
        expect(workbook.sheets[0].rows).toContainEqual({
            item: '국가 필터',
            value: '전체 국가',
            unit: null,
            description: '회사 목록 페이지의 현재 국가 필터입니다.',
        });
        expect(workbook.sheets[0].rows).toContainEqual({
            item: '정렬',
            value: '회사명 순',
            unit: null,
            description: '회사 목록 페이지의 현재 정렬 기준입니다.',
        });
        expect(workbook.sheets[0].rows).toContainEqual({
            item: '보고서 포함 회사 수',
            value: 0,
            unit: '개',
            description: '현재 국가/연도/정렬 조건을 반영한 회사 수입니다.',
        });
        expect(workbook.sheets[0].rows).toContainEqual({
            item: '평균 리스크 점수',
            value: null,
            unit: '점',
            description: '현재 보고서 포함 회사의 평균 리스크 점수입니다.',
        });
    });
});
