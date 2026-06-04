// 배출량을 배출권 수량과 비용 시나리오로 환산하는 순수 유틸리티

export function getRequiredAllowances(emissionsTco2e: number): number {
    if (!Number.isFinite(emissionsTco2e) || emissionsTco2e <= 0) return 0;
    return Math.ceil(emissionsTco2e);
}

export function getAllowanceCostKrw(requiredAllowances: number, allowancePriceKrw: number): number {
    if (
        !Number.isFinite(requiredAllowances) ||
        !Number.isFinite(allowancePriceKrw) ||
        requiredAllowances <= 0 ||
        allowancePriceKrw <= 0
    ) {
        return 0;
    }

    return Math.round(requiredAllowances * allowancePriceKrw);
}

export function getSavedAllowances(
    baselineEmissionsTco2e: number,
    reducedEmissionsTco2e: number
): number {
    return Math.max(
        0,
        getRequiredAllowances(baselineEmissionsTco2e) - getRequiredAllowances(reducedEmissionsTco2e)
    );
}
