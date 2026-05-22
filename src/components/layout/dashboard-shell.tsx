'use client';
// 사이드바와 메인 콘텐츠 영역의 전체 레이아웃 구성

import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ReactNode } from 'react';
import { AppBreadcrumb } from './app-breadcrumb';
import { AppSidebar } from './app-sidebar';

// 사이드바 Provider 및 메인 콘텐츠 래퍼 렌더링
export function DashboardShell({ children }: { children: ReactNode }) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="bg-background flex h-14 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1 cursor-pointer" />
                    <Separator orientation="vertical" className="mx-2 h-4" />
                    <AppBreadcrumb />
                </header>
                <div className="flex-1 overflow-auto p-6">{children}</div>
            </SidebarInset>
        </SidebarProvider>
    );
}
