// 앱 사이드바 레이아웃 및 로고 영역 구성

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from '@/components/ui/sidebar';
import { ROUTES } from '@/constants/navigation';
import { BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { SidebarNav } from './sidebar-nav';

// 로고·브랜딩 및 내비게이션을 포함한 사이드바 렌더링
export function AppSidebar() {
    return (
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild tooltip="GHG Dashboard">
                            <Link href={ROUTES.dashboard}>
                                <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                                    <BarChart3 className="size-4" />
                                </div>
                                <div className="flex flex-col gap-0.5 leading-none">
                                    <span className="font-semibold">GHG Dashboard</span>
                                    <span className="text-muted-foreground text-xs">HanaLoop</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <SidebarNav />
            </SidebarContent>
            <SidebarFooter className="border-t px-3 py-3">
                <div className="space-y-2 group-data-[collapsible=icon]:hidden">
                    <p className="text-foreground text-xs font-medium">GHG Emissions Dashboard</p>
                    <p className="text-muted-foreground text-xs">HanaLoop · PCF 관리 플랫폼</p>
                    <p className="text-muted-foreground text-xs">
                        © 2026 HanaLoop. All rights reserved.
                    </p>
                </div>
            </SidebarFooter>
            {/* 접힌 상태에서 마우스오버 시 사이드바를 펼치는 핸들 */}
            <SidebarRail />
        </Sidebar>
    );
}
