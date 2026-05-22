import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/sonner';
import { ReactNode } from 'react';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: 'PCF Dashboard',
    description: '기업 PCF 및 온실가스 배출 현황 시각화 대시보드',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: ReactNode;
}>) {
    return (
        <html lang="ko">
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <Providers>
                    <DashboardShell>{children}</DashboardShell>
                </Providers>
                <Toaster richColors position="bottom-right" />
            </body>
        </html>
    );
}
