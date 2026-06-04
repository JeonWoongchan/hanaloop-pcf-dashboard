// 리스크 우선순위 테이블 행 렌더링

import { TableCell, TableRow } from '@/components/ui/table';
import { COUNTRY_FLAGS } from '@/constants/countries';
import { SCOPE_LABELS } from '@/constants/ghg-scope';
import { ROUTES } from '@/constants/navigation';
import { formatEmissions, formatKrw, getTrendProps } from '@/lib/format';
import type { RiskAssessment } from '@/lib/risk';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { RiskLevelBadge } from './risk-level-badge';

type Props = {
    assessment: RiskAssessment;
};

// 주요 Scope 비중 표시값 산정
function getDominantScopeLabel(assessment: RiskAssessment): string {
    if (!assessment.dominantScope) return '-';
    return `${SCOPE_LABELS[assessment.dominantScope]} · ${assessment.dominantScopePct.toFixed(1)}%`;
}

export function RiskPriorityRow({ assessment }: Props) {
    const trend = getTrendProps(assessment.recentTrendPct);

    return (
        <TableRow>
            {/* 회사명은 행 헤더(th)로 유지해 스크린 리더 접근성 확보 */}
            <th scope="row" className="p-2 py-4 pr-4 text-left align-middle font-medium">
                <Link
                    href={ROUTES.companyDetail(assessment.id)}
                    className="group text-foreground inline-flex max-w-52 items-center gap-2 hover:underline"
                >
                    <span>{COUNTRY_FLAGS[assessment.country] ?? ''}</span>
                    <span className="truncate">{assessment.name}</span>
                    <ArrowRight className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
            </th>
            <TableCell className="py-4 pr-4 text-center">
                <RiskLevelBadge level={assessment.level} />
            </TableCell>
            <TableCell className="py-4 pr-4 text-center font-medium">{assessment.score}</TableCell>
            <TableCell className="py-4 pr-4 text-right">
                {formatEmissions(assessment.annualEmissions)} tCO₂e
            </TableCell>
            <TableCell className="py-4 pr-4 text-right">
                {formatKrw(assessment.estimatedAllowanceCostKrw)}
            </TableCell>
            <TableCell className={`py-4 pr-4 text-center font-medium ${trend.className}`}>
                {trend.label}
            </TableCell>
            <TableCell className="py-4 pr-4 text-center">
                {getDominantScopeLabel(assessment)}
            </TableCell>
            <TableCell className="py-4 whitespace-normal">
                <ul className="text-muted-foreground max-w-80 space-y-1">
                    {assessment.reasons.map((reason, i) => (
                        <li key={i} className="leading-relaxed">
                            {reason}
                        </li>
                    ))}
                </ul>
            </TableCell>
        </TableRow>
    );
}
