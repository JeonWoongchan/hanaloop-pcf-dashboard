// 회사 목록 필터·정렬 상태 관리 훅

import { useCompanies } from '@/hooks/companies/useCompanies';
import { useCountries } from '@/hooks/countries/useCountries';
import { filterByYear, getAvailableYears, getSelectedYear, sumEmissions } from '@/lib/emissions';
import { getRiskAssessments } from '@/lib/risk';
import type { RiskAssessment } from '@/lib/risk';
import type { CompanyWithTotal } from '@/types';
import { parseAsArrayOf, parseAsInteger, parseAsString, parseAsStringLiteral, useQueryState } from 'nuqs';
import { useCallback, useMemo } from 'react';

export const SORT_OPTIONS = [
    { value: 'desc', label: '배출량 많은 순' },
    { value: 'asc', label: '배출량 적은 순' },
    { value: 'name', label: '회사명 순' },
] as const;

type SortOrder = (typeof SORT_OPTIONS)[number]['value'];

const sortParser = parseAsStringLiteral(
    SORT_OPTIONS.map((o) => o.value) as [SortOrder, ...SortOrder[]]
).withDefault('desc');

// 빈 배열 = 전체 국가 선택 (all mode)
const countryParser = parseAsArrayOf(parseAsString).withDefault([]);

// 국가 필터·정렬이 적용된 회사 목록과 필터 컨트롤 상태 반환
export function useCompaniesFilter() {
    const { data: companies, isLoading, error, refetch } = useCompanies();
    const { data: countries } = useCountries();

    const [yearParam, setYearParam] = useQueryState('year', parseAsInteger);
    const [selectedCountries, setSelectedCountries] = useQueryState('country', countryParser);
    const [sortOrder, setSortOrder] = useQueryState('sort', sortParser);

    // O(1) 국가명 조회를 위한 Map
    const countriesMap = useMemo(
        () => new Map(countries?.map((c) => [c.code, c.name]) ?? []),
        [countries]
    );

    // 데이터에서 사용 가능한 연도 목록
    const availableYears = useMemo(
        () => (companies ? getAvailableYears(companies.flatMap((c) => c.emissions)) : []),
        [companies]
    );
    const selectedYear = getSelectedYear(yearParam, availableYears);

    // 데이터에 존재하는 국가 목록 — 국가명 병합
    const countryOptions = useMemo(() => {
        if (!companies) return [];
        const codes = [...new Set(companies.map((c) => c.country))].sort();
        return codes.map((code) => ({
            code,
            name: countriesMap.get(code) ?? code,
        }));
    }, [companies, countriesMap]);

    // 드롭다운 체크 여부 — 전체 모드이면 모든 항목 체크 상태
    const isCountryChecked = useCallback(
        (code: string) => selectedCountries.length === 0 || selectedCountries.includes(code),
        [selectedCountries]
    );

    const toggleCountry = useCallback(
        (code: string) => {
            if (selectedCountries.length === 0) {
                // 전체 모드에서 하나 해제 → 나머지 전부를 명시적으로 선택
                void setSelectedCountries(
                    countryOptions.filter((c) => c.code !== code).map((c) => c.code)
                );
            } else if (selectedCountries.includes(code)) {
                void setSelectedCountries(selectedCountries.filter((c) => c !== code));
            } else {
                const next = [...selectedCountries, code];
                // 모든 국가가 선택되면 URL을 깔끔하게 전체 모드로 전환
                void setSelectedCountries(next.length === countryOptions.length ? [] : next);
            }
        },
        [selectedCountries, countryOptions, setSelectedCountries]
    );

    // 필터·정렬 적용된 회사 목록 — total 필드 포함
    const displayedCompanies = useMemo((): CompanyWithTotal[] => {
        if (!companies) return [];

        // 선택 연도 배출량만 집계
        const withTotals = companies.map((c) => ({
            ...c,
            total: sumEmissions(filterByYear(c.emissions, selectedYear)),
        }));

        const filtered =
            selectedCountries.length === 0
                ? withTotals
                : withTotals.filter((c) => selectedCountries.includes(c.country));

        if (sortOrder === 'asc') return [...filtered].sort((a, b) => a.total - b.total);
        if (sortOrder === 'name') return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
        return [...filtered].sort((a, b) => b.total - a.total);
    }, [companies, selectedCountries, sortOrder, selectedYear]);

    // 전체 회사 기준 상대 점수 산정 후 id → assessment Map으로 O(1) 조회
    const riskMap = useMemo((): Map<string, RiskAssessment> => {
        if (!companies) return new Map();
        const assessments = getRiskAssessments(companies, selectedYear);
        return new Map(assessments.map((a) => [a.id, a]));
    }, [companies, selectedYear]);

    return {
        isLoading,
        error,
        refetch,
        displayedCompanies,
        countryOptions,
        isCountryChecked,
        toggleCountry,
        selectedCountries,
        sortOrder,
        setSortOrder,
        selectedYear,
        availableYears,
        setSelectedYear: useCallback((y: number) => { void setYearParam(y); }, [setYearParam]),
        riskMap,
    };
}
