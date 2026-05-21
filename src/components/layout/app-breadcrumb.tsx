'use client';
// 헤더 브레드크럼 — 경로별 현재 위치 표시

import { ROUTES } from '@/constants/navigation';
import { useCompanies } from '@/hooks/companies/useCompanies';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// 경로별 브레드크럼 렌더링 — 홈/목록/상세
export function AppBreadcrumb() {
    const pathname = usePathname();
    const { data: companies } = useCompanies();

    const isCompanyDetail = pathname.startsWith(`${ROUTES.companies}/`);
    const companyId = isCompanyDetail ? pathname.split('/').at(-1) : undefined;
    const currentCompany = companies?.find((c) => c.id === companyId);

    if (pathname === ROUTES.dashboard) {
        return <span className="text-sm font-medium text-foreground">대시보드</span>;
    }

    if (pathname === ROUTES.companies) {
        return <span className="text-sm font-medium text-foreground">회사 목록</span>;
    }

    if (isCompanyDetail) {
        return (
            <div className="flex items-center gap-1.5 text-sm">
                <Link
                    href={ROUTES.companies}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                >
                    회사 목록
                </Link>
                <span className="text-muted-foreground">/</span>
                <span className="font-medium text-foreground">
                    {currentCompany?.name ?? '회사 상세'}
                </span>
            </div>
        );
    }

    return null;
}
