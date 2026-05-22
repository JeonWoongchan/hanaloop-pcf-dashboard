import { CompaniesContent } from '@/components/companies/companies-content';
import { InfoTooltip } from '@/components/shared/info-tooltip';
import { Suspense } from 'react';

export default function CompaniesPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">회사 목록</h2>
                <p className="text-muted-foreground flex items-center">
                    등록된 회사별 배출 현황
                    <InfoTooltip
                        content={
                            '국가·연도 필터와 정렬을 조합해 원하는 회사를 찾을 수 있습니다.\n\n각 카드에는 해당 연도의 연간 총 배출량과 Scope별 비중이 표시됩니다. 카드를 클릭하면 월별 추이, 배출원 상세 등 회사 상세 페이지로 이동합니다.'
                        }
                    />
                </p>
            </div>
            <Suspense>
                <CompaniesContent />
            </Suspense>
        </div>
    );
}
