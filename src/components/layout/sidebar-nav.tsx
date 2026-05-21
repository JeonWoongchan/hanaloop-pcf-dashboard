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
} from '@/components/ui/sidebar';
import { COUNTRY_FLAGS } from '@/constants/countries';
import { ROUTES } from '@/constants/navigation';
import { useCompanies } from '@/hooks/companies/useCompanies';
import type { LucideIcon } from 'lucide-react';
import { Building2, ChevronDown, FlameKindling, LayoutDashboard, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Collapsible } from 'radix-ui';

// 활성 항목 강조 스타일
const ACTIVE_CLASS =
    'data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground';

// Collapsible.Trigger asChild 시 data-[state=open]:hover가 active 배경을 덮는 충돌 방지
// data-[active=true]:data-[state=open]:hover (specificity 0-3-0) > data-[state=open]:hover (0-2-0)
const COLLAPSIBLE_ACTIVE_FIX =
    'data-[active=true]:data-[state=open]:hover:bg-sidebar-primary data-[active=true]:data-[state=open]:hover:text-sidebar-primary-foreground';

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
            <SidebarMenuButton asChild isActive={isActive} tooltip={title} className={ACTIVE_CLASS}>
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
    const { data: companies } = useCompanies();

    const isCompaniesActive = pathname.startsWith(ROUTES.companies);
    const currentCompanyId = extractCompanyId(pathname);

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
                        title="리스크 관리"
                        href={ROUTES.risk}
                        icon={ShieldAlert}
                        isActive={pathname === ROUTES.risk}
                    />

                    <NavItem
                        title="배출원 분석"
                        href={ROUTES.sources}
                        icon={FlameKindling}
                        isActive={pathname === ROUTES.sources}
                    />

                    {/* 회사 목록 — 접을 수 있는 서브메뉴, 버튼 클릭 시 목록 페이지로 이동 */}
                    <Collapsible.Root defaultOpen={isCompaniesActive} className="group/collapsible">
                        <SidebarMenuItem>
                            <Collapsible.Trigger asChild>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isCompaniesActive}
                                    tooltip="관리 대상 회사"
                                    className={`${ACTIVE_CLASS} ${COLLAPSIBLE_ACTIVE_FIX}`}
                                >
                                    <Link href={ROUTES.companies}>
                                        <Building2 />
                                        <span>관리 대상 회사</span>
                                        <ChevronDown className="ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                                    </Link>
                                </SidebarMenuButton>
                            </Collapsible.Trigger>
                            <Collapsible.Content>
                                <SidebarMenuSub>
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
                                                        <span className="truncate">{company.name}</span>
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
