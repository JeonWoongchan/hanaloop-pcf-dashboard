'use client';

// 회사 목록 필터·정렬 UI 및 카드 그리드 렌더링

import { useEffect, useState } from 'react';
import { Plus, Upload } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { AsyncStateBoundary } from '@/components/shared/async-state-boundary';
import { ExcelImportDialog } from '@/components/import/excel-import-dialog';
import { GhgImportDialog } from '@/components/import/ghg-import-dialog';
import { ReportExportButton } from '@/components/reports/report-export-button';
import { CardGridSkeleton } from '@/components/shared/loading-skeletons';
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
import { Button } from '@/components/ui/button';
import { SORT_OPTIONS, useCompaniesFilter } from '@/hooks/companies/useCompaniesFilter';
import { useDeleteCompany } from '@/hooks/companies/useCompanyMutations';
import { toast } from 'sonner';
import { CompanyCard } from './company-card';
import { CompanyFormDialog } from './company-form-dialog';
import type { CompanyPcfTotal } from '@/lib/emissions';
import { buildCompaniesReportWorkbook } from '@/lib/reports/builders/companies-report';

// 회사 목록 로딩 중 스켈레톤 그리드
function CompaniesGridSkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex gap-3">
                <Skeleton className="h-10 w-48 rounded-md" />
                <Skeleton className="h-10 w-44 rounded-md" />
            </div>
            <CardGridSkeleton />
        </div>
    );
}

// 회사 목록 컨텐츠 렌더링
export function CompaniesContent() {
    const [importOpen, setImportOpen] = useState(false);
    const [ghgImportOpen, setGhgImportOpen] = useState(false);
    const [formOpen, setFormOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<
        { id: string; name: string; countryCode: string } | undefined
    >();

    const {
        isLoading,
        error,
        refetch,
        countriesError,
        totalCompanyCount,
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
        riskMap,
    } = useCompaniesFilter();

    const deleteMutation = useDeleteCompany();
    const [countryOpen, setCountryOpen] = useState(false);

    useEffect(() => {
        if (countriesError) {
            toast.error('국가 목록을 불러오지 못해 국가 코드로 표시합니다.');
        }
    }, [countriesError]);

    const handleEdit = (company: CompanyPcfTotal) => {
        setEditTarget({ id: company.id, name: company.name, countryCode: company.country });
        setFormOpen(true);
    };

    const handleFormClose = (open: boolean) => {
        setFormOpen(open);
        if (!open) setEditTarget(undefined);
    };

    // isEmpty: DB에 회사가 아예 없는 경우 / 필터 후 결과 없음은 내부 EmptyState로 별도 처리
    return (
        <>
            <ExcelImportDialog open={importOpen} onOpenChangeAction={setImportOpen} />
            <GhgImportDialog open={ghgImportOpen} onOpenChangeAction={setGhgImportOpen} />
            <CompanyFormDialog
                open={formOpen}
                onOpenChangeAction={handleFormClose}
                editTarget={editTarget}
            />
            <AsyncStateBoundary
                isLoading={isLoading}
                error={error}
                isEmpty={totalCompanyCount === 0 && !isLoading}
                loadingFallback={<CompaniesGridSkeleton />}
                emptyMessage="등록된 관리 대상 회사가 없습니다."
                onRetry={refetch}
            >
                <div className="space-y-4">
                    {/* 필터·정렬 컨트롤 */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* 회사 추가 */}
                        <Button
                            size="sm"
                            onClick={() => {
                                setEditTarget(undefined);
                                setFormOpen(true);
                            }}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            회사 추가
                        </Button>

                        {/* Excel 활동 데이터 임포트 */}
                        <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
                            <Upload className="mr-2 h-4 w-4" />
                            활동 데이터 임포트
                        </Button>

                        {/* Excel GHG 배출량 임포트 */}
                        <Button variant="outline" size="sm" onClick={() => setGhgImportOpen(true)}>
                            <Upload className="mr-2 h-4 w-4" />
                            GHG 배출량 임포트
                        </Button>

                        <ReportExportButton
                            buildReportAction={() =>
                                buildCompaniesReportWorkbook({
                                    year: selectedYear,
                                    companies: displayedCompanies,
                                    totalCompanyCount,
                                    selectedCountries,
                                    countryOptions,
                                    sortOrder,
                                    riskMap,
                                })
                            }
                            fileName={`companies-report-${selectedYear}`}
                        />

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

                        <p className="text-muted-foreground text-sm">
                            {displayedCompanies.length}개 회사
                        </p>
                    </div>

                    {/* Scope 범례 — 카드 바 색상과 SCOPE_COLORS로 연동 */}
                    <ScopeLegend />

                    {displayedCompanies.length === 0 ? (
                        <EmptyState message="해당 조건의 회사가 없습니다." />
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {displayedCompanies.map((company) => (
                                <CompanyCard
                                    key={company.id}
                                    company={company}
                                    year={selectedYear}
                                    riskAssessment={riskMap.get(company.id)}
                                    onEditAction={() => handleEdit(company)}
                                    onDeleteAction={() => deleteMutation.mutate(company.id)}
                                    isDeleting={
                                        deleteMutation.variables === company.id &&
                                        deleteMutation.isPending
                                    }
                                />
                            ))}
                        </div>
                    )}
                </div>
            </AsyncStateBoundary>
        </>
    );
}
