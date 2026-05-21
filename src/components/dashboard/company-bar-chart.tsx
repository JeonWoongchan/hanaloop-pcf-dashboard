'use client';

// 연간 배출량 상위 N개 회사 비교 바 차트 렌더링

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CHART_COLORS } from '@/constants/chart';
import { ROUTES } from '@/constants/navigation';
import type { CompanyTotal } from '@/lib/emissions';
import { formatCompanyName, formatEmissions } from '@/lib/format';
import { InfoTooltip } from '@/components/shared/info-tooltip';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

// 대시보드에서 표시할 상위 회사 수
const TOP_N = 10;
// Y축 레이블 최대 글자 수 — 영문 기준 width={YAXIS_WIDTH}에 맞게 조정
const YAXIS_WIDTH = 180;
const YAXIS_MAX_LEN = 20;

type Props = {
    data: CompanyTotal[];
    year: number;
};

// 연간 배출량 상위 N개 회사 수평 바 차트 렌더링
export function CompanyBarChart({ data, year }: Props) {
    const router = useRouter();
    const topData = data.slice(0, TOP_N).map((entry, i) => ({
        ...entry,
        fill: CHART_COLORS[i % CHART_COLORS.length],
    }));

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                    연간 배출량 상위 {TOP_N}개 회사
                    <InfoTooltip content="연간 누적 배출량 기준 상위 10개 기업을 수평 막대 그래프로 비교합니다. 막대를 클릭하면 해당 기업 상세 페이지로 이동합니다." />
                </CardTitle>
                <CardDescription>{year}년 누적 온실가스 배출량 기준 (tCO₂e)</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                        data={topData}
                        layout="vertical"
                        margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                    >
                        <XAxis
                            type="number"
                            tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
                        />
                        <YAxis
                            type="category"
                            dataKey="name"
                            width={YAXIS_WIDTH}
                            tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(name) => formatCompanyName(name, YAXIS_MAX_LEN)}
                        />
                        <Tooltip
                            labelFormatter={(name) => name}
                            labelStyle={{ fontWeight: 600, color: 'var(--foreground)', marginBottom: 4 }}
                            formatter={(value, _name, item) => {
                                // 막대 색상과 툴팁 텍스트 색상 동기화
                                const color = (item as { payload?: { fill?: string } }).payload?.fill;
                                const formatted = typeof value === 'number'
                                    ? `${formatEmissions(value)} tCO₂e`
                                    : '-';
                                return [
                                    <span key="v" style={{ color }}>{formatted}</span>,
                                    <span key="n" style={{ color }}>연간 총 배출량</span>,
                                ];
                            }}
                            contentStyle={{
                                backgroundColor: 'var(--card)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius)',
                                fontSize: 12,
                            }}
                        />
                        {/* Bar onClick으로 직접 처리 — BarChart onClick보다 신뢰성 높음 */}
                        <Bar
                            dataKey="total"
                            radius={[0, 4, 4, 0]}
                            cursor="pointer"
                            onClick={(data) => {
                                if (typeof data?.id === 'string') {
                                    router.push(ROUTES.companyDetail(data.id));
                                }
                            }}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
            {/* 전체 회사 목록 페이지 링크 */}
            <CardFooter className="border-t pt-4">
                <Link
                    href={ROUTES.companies}
                    className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                    전체 회사 목록 보기
                    <ArrowRight className="size-4" />
                </Link>
            </CardFooter>
        </Card>
    );
}
