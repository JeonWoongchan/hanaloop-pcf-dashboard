'use client';

// 회사 목록 필터·정렬 UI 및 카드 그리드 렌더링

import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { MultiSelectPopover } from '@/components/shared/multi-select-popover';
import { ScopeLegend } from '@/components/shared/scope-legend';
import { YearSelector } from '@/components/shared/year-selector';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { SORT_OPTIONS, useCompaniesFilter } from '@/hooks/companies/useCompaniesFilter';
import { useState } from 'react';
import { CompanyCard } from './company-card';

// 회사 목록 로딩 중 스켈레톤 그리드
function CompaniesGridSkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex gap-3">
                <Skeleton className="h-10 w-48 rounded-md" />
                <Skeleton className="h-10 w-44 rounded-md" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-52 rounded-xl" />
                ))}
            </div>
        </div>
    );
}

// 회사 목록 컨텐츠 렌더링
export function CompaniesContent() {
    const {
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
        setSelectedYear,
    } = useCompaniesFilter();

    const [countryOpen, setCountryOpen] = useState(false);

    if (isLoading) return <CompaniesGridSkeleton />;
    if (error) return <ErrorState onRetry={refetch} />;

    return (
        <div className="space-y-4">
            {/* 필터·정렬 컨트롤 */}
            <div className="flex flex-wrap items-center gap-3">
                {/* 국가 선택 */}
                <MultiSelectPopover
                    items={countryOptions.map((c) => ({ id: c.code, label: c.name }))}
                    label={
                        selectedCountries.length === 0
                            ? '전체 국가'
                            : `${selectedCountries.length}개국 선택됨`
                    }
                    open={countryOpen}
                    onOpenChangeAction={setCountryOpen}
                    isSelectedAction={isCountryChecked}
                    onToggleAction={toggleCountry}
                    searchPlaceholder="국가 검색..."
                    width="w-48"
                    side="bottom"
                />

                {/* 연도 선택 */}
                <YearSelector
                    years={availableYears}
                    value={selectedYear}
                    onChangeAction={setSelectedYear}
                />

                {/* 정렬 */}
                <Select
                    value={sortOrder}
                    onValueChange={(v) =>
                        void setSortOrder(v as (typeof SORT_OPTIONS)[number]['value'])
                    }
                >
                    <SelectTrigger className="w-44">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent side="bottom">
                        {SORT_OPTIONS.map(({ value, label }) => (
                            <SelectItem key={value} value={value}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <p className="text-sm text-muted-foreground">{displayedCompanies.length}개 회사</p>
            </div>

            {/* Scope 범례 — 카드 바 색상과 SCOPE_COLORS로 연동 */}
            <ScopeLegend />

            {displayedCompanies.length === 0 ? (
                <EmptyState message="해당 조건의 회사가 없습니다." />
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {displayedCompanies.map((company) => (
                        <CompanyCard key={company.id} company={company} year={selectedYear} />
                    ))}
                </div>
            )}
        </div>
    );
}
