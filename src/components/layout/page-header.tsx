'use client';
// 현재 경로 기반 페이지 타이틀 표시

import { PAGE_TITLES, ROUTES } from '@/constants/navigation';
import { usePathname } from 'next/navigation';

// 경로에 대응하는 타이틀 반환
function getTitle(pathname: string): string {
    if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
    if (pathname.startsWith(`${ROUTES.companies}/`)) return '회사 상세';
    return '';
}

// 헤더 영역 페이지 타이틀 텍스트 렌더링
export function PageHeader() {
    const pathname = usePathname();
    return <span className="text-foreground text-sm font-medium">{getTitle(pathname)}</span>;
}
