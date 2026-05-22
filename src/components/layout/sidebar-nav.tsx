'use client';
// 사이드바 내비게이션 메뉴 렌더링 및 활성 경로 표시

import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { COUNTRY_FLAGS } from '@/constants/countries';
import { ROUTES } from '@/constants/navigation';
import { useCompanies } from '@/hooks/companies/useCompanies';
import type { LucideIcon } from 'lucide-react';
import {
    Building2,
    ChevronDown,
    FlameKindling,
    LayoutDashboard,
    List,
    ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Collapsible } from 'radix-ui';
import { useState } from 'react';

// 회사 상세 경로에서 company id 추출
function extractCompanyId(pathname: string): string | undefined {
    if (!pathname.startsWith(`${ROUTES.companies}/`)) return undefined;
    return pathname.split('/').at(-1);
}

// 단순 링크 내비게이션 아이템
function NavItem({
    title,
    href,
    icon: Icon,
    isActive,
}: {
    title: string;
    href: string;
    icon: LucideIcon;
    isActive: boolean;
}) {
    return (
        <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive} tooltip={title}>
                <Link href={href}>
                    <Icon />
                    <span>{title}</span>
                </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
}

// 내비게이션 메뉴 아이템 목록 렌더링
export function SidebarNav() {
    const pathname = usePathname();
    const router = useRouter();
    const { state: sidebarState } = useSidebar();
    const { data: companies } = useCompanies();

    const isCompaniesActive = pathname.startsWith(ROUTES.companies);
    const isExactCompanies = pathname === ROUTES.companies;
    const currentCompanyId = extractCompanyId(pathname);

    // companies 경로 진입 시 목록 자동 확장 (렌더 중 setState로 effect 없이 동기화)
    const [companiesOpen, setCompaniesOpen] = useState(isCompaniesActive);
    const [prevIsCompaniesActive, setPrevIsCompaniesActive] = useState(isCompaniesActive);
    if (prevIsCompaniesActive !== isCompaniesActive) {
        setPrevIsCompaniesActive(isCompaniesActive);
        if (isCompaniesActive) {
            setCompaniesOpen(true);
        }
    }

    // 사이드바 축소 상태에서만 아이콘 클릭 시 목록 페이지로 이동, 확장 상태에서는 토글만 수행
    const handleCompaniesClick = () => {
        if (sidebarState === 'collapsed') {
            router.push(ROUTES.companies);
        }
    };

    return (
        <SidebarGroup>
            <SidebarGroupContent>
                <SidebarMenu>
                    <NavItem
                        title="대시보드"
                        href={ROUTES.dashboard}
                        icon={LayoutDashboard}
                        isActive={pathname === ROUTES.dashboard}
                    />

                    <NavItem
                        title="배출원 분석"
                        href={ROUTES.sources}
                        icon={FlameKindling}
                        isActive={pathname === ROUTES.sources}
                    />

                    <NavItem
                        title="리스크 관리"
                        href={ROUTES.risk}
                        icon={ShieldAlert}
                        isActive={pathname === ROUTES.risk}
                    />

                    {/* 회사 목록 — 접을 수 있는 서브메뉴, 축소 상태에서만 아이콘 클릭 시 목록 페이지 이동 */}
                    <Collapsible.Root
                        open={companiesOpen}
                        onOpenChange={setCompaniesOpen}
                        className="group/collapsible"
                    >
                        <SidebarMenuItem>
                            <Collapsible.Trigger asChild>
                                <SidebarMenuButton
                                    tooltip="관리 대상 회사"
                                    onClick={handleCompaniesClick}
                                >
                                    <Building2 />
                                    <span>관리 대상 회사</span>
                                    <ChevronDown className="ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                                </SidebarMenuButton>
                            </Collapsible.Trigger>
                            <Collapsible.Content>
                                <SidebarMenuSub>
                                    {/* 전체 목록 항목 */}
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton asChild isActive={isExactCompanies}>
                                            <Link href={ROUTES.companies}>
                                                <List className="size-3.5" />
                                                <span>전체 목록</span>
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    {/* 회사별 서브 항목 */}
                                    {companies?.map((company) => {
                                        const flag = COUNTRY_FLAGS[company.country] ?? '';
                                        return (
                                            <SidebarMenuSubItem key={company.id}>
                                                <SidebarMenuSubButton
                                                    asChild
                                                    isActive={currentCompanyId === company.id}
                                                >
                                                    <Link href={ROUTES.companyDetail(company.id)}>
                                                        <span>{flag}</span>
                                                        <span className="truncate">
                                                            {company.name}
                                                        </span>
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        );
                                    })}
                                </SidebarMenuSub>
                            </Collapsible.Content>
                        </SidebarMenuItem>
                    </Collapsible.Root>
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}
