// 리스크 우선순위 테이블 행 렌더링

import { COUNTRY_FLAGS } from '@/constants/countries';
import { SCOPE_LABELS } from '@/constants/ghg-scope';
import { ROUTES } from '@/constants/navigation';
import { formatEmissions, formatKrw } from '@/lib/format';
import type { RiskAssessment } from '@/lib/risk';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { RiskLevelBadge } from './risk-level-badge';

type Props = {
    assessment: RiskAssessment;
};

// 최근 추세 변화율 표시값 산정
function getTrendDisplay(value: number | null) {
    if (value === null) return { label: '-', className: 'text-muted-foreground' };
    const prefix = value > 0 ? '+' : '';
    return {
        label: `${prefix}${value.toFixed(1)}%`,
        className: value > 0 ? 'text-destructive' : 'text-success',
    };
}

// 주요 Scope 비중 표시값 산정
function getDominantScopeLabel(assessment: RiskAssessment): string {
    if (!assessment.dominantScope) return '-';
    return `${SCOPE_LABELS[assessment.dominantScope]} · ${assessment.dominantScopePct.toFixed(1)}%`;
}

export function RiskPriorityRow({ assessment }: Props) {
    const trend = getTrendDisplay(assessment.recentTrendPct);

    return (
        <tr className="border-b last:border-0">
            <th scope="row" className="py-4 pr-4 text-left">
                <Link
                    href={ROUTES.companyDetail(assessment.id)}
                    className="group inline-flex max-w-52 items-center gap-2 font-medium text-foreground hover:underline"
                >
                    <span>{COUNTRY_FLAGS[assessment.country] ?? ''}</span>
                    <span className="truncate">{assessment.name}</span>
                    <ArrowRight className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
            </th>
            <td className="py-4 pr-4 text-center">
                <RiskLevelBadge level={assessment.level} />
            </td>
            <td className="py-4 pr-4 text-center font-medium">{assessment.score}</td>
            <td className="py-4 pr-4 text-right">
                {formatEmissions(assessment.annualEmissions)} tCO₂e
            </td>
            <td className="py-4 pr-4 text-right">{formatKrw(assessment.estimatedTaxKrw)}</td>
            <td className={`py-4 pr-4 text-center font-medium ${trend.className}`}>
                {trend.label}
            </td>
            <td className="py-4 pr-4 text-center">{getDominantScopeLabel(assessment)}</td>
            <td className="py-4">
                <ul className="max-w-80 space-y-1 text-muted-foreground">
                    {assessment.reasons.map((reason) => (
                        <li key={reason} className="leading-relaxed">
                            {reason}
                        </li>
                    ))}
                </ul>
            </td>
        </tr>
    );
}
