// 대시보드 집계 지표 계산 훅 — companies 참조 변경 시에만 재계산

import {
    getImprovingCompanyCount,
    getMonthlyByCompany,
    getMonthlyTotals,
    getMonthOverMonthChange,
    getTotalByCompany,
} from '@/lib/emissions';
import type { Company } from '@/types';
import { useMemo } from 'react';

// 대시보드 표시에 필요한 집계 지표 일괄 계산 및 메모이제이션
export function useDashboardMetrics(companies: Company[]) {
    return useMemo(() => {
        const monthlyTotals = getMonthlyTotals(companies);
        return {
            monthlyTotals,
            momChange: getMonthOverMonthChange(monthlyTotals),
            totalByCompany: getTotalByCompany(companies),
            monthlyByCompany: getMonthlyByCompany(companies),
            improvingCount: getImprovingCompanyCount(companies),
        };
    }, [companies]);
}
