// 리스크 페이지 지표 계산 훅

import { getAvailableYears, getSelectedYear } from '@/lib/emissions';
import { getRiskAssessments, getRiskSummary } from '@/lib/risk';
import { ALLOWANCE_PRICE_KRW_PER_TCO2E } from '@/constants/risk';
import { useAllowancePrice } from '@/hooks/allowance-price/useAllowancePrice';
import type { Company } from '@/types';
import { useMemo } from 'react';

// 리스크 페이지 표시에 필요한 파생 지표 일괄 계산
export function useRiskMetrics(companies: Company[], year?: number | null) {
    const availableYears = useMemo(
        () => getAvailableYears(companies.flatMap((c) => c.emissions)),
        [companies]
    );
    const selectedYear = getSelectedYear(year, availableYears);

    // 선택 연도 기준 배출권 단가 조회 — DB 미로드 시 상수 폴백
    const { data: allowanceData } = useAllowancePrice(selectedYear);
    const allowancePrice = allowanceData?.priceKrw ?? ALLOWANCE_PRICE_KRW_PER_TCO2E;

    const assessments = useMemo(
        () => getRiskAssessments(companies, selectedYear, allowancePrice),
        [companies, selectedYear, allowancePrice]
    );
    const summary = useMemo(() => getRiskSummary(assessments), [assessments]);

    return { selectedYear, availableYears, assessments, summary };
}
