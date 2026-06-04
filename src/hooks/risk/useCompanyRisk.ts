// 단일 회사 리스크 산정 훅 — useCompanies 캐시를 재활용해 추가 요청 없음

import { useCompanies } from '@/hooks/companies/useCompanies';
import { useAllowancePrice } from '@/hooks/allowance-price/useAllowancePrice';
import { ALLOWANCE_PRICE_KRW_PER_TCO2E } from '@/constants/risk';
import { getRiskAssessments } from '@/lib/risk';
import type { RiskAssessment } from '@/lib/risk';
import { useMemo } from 'react';

export type CompanyRiskResult = {
    assessment: RiskAssessment | null;
    rank: number | null;
    total: number;
};

export function useCompanyRisk(companyId: string, year: number): CompanyRiskResult {
    const { data: companies } = useCompanies();
    const { data: allowanceData } = useAllowancePrice();
    const allowancePrice = allowanceData?.priceKrw ?? ALLOWANCE_PRICE_KRW_PER_TCO2E;

    return useMemo(() => {
        if (!companies) return { assessment: null, rank: null, total: 0 };
        // getRiskAssessments는 점수 내림차순 정렬 → index + 1 = 리스크 순위
        const assessments = getRiskAssessments(companies, year, allowancePrice);
        const index = assessments.findIndex((a) => a.id === companyId);
        return {
            assessment: index >= 0 ? assessments[index] : null,
            rank: index >= 0 ? index + 1 : null,
            total: assessments.length,
        };
    }, [companies, companyId, year, allowancePrice]);
}
