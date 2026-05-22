// KPI/요약 지표 카드 공통 렌더링

import { InfoTooltip } from '@/components/shared/info-tooltip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

type Props = {
    title: string;
    tooltip: string;
    value: ReactNode;
    helper: ReactNode;
    icon?: LucideIcon | null;
    helperClassName?: string;
    valueClassName?: string;
    href?: string;
};

export function MetricCard({
    title,
    tooltip,
    value,
    helper,
    icon: Icon,
    helperClassName = 'text-muted-foreground',
    valueClassName = '',
    href,
}: Props) {
    const card = (
        <Card className={href ? 'cursor-pointer transition-shadow hover:shadow-md' : ''}>
            <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground flex items-center text-sm font-medium">
                    {title}
                    <InfoTooltip content={tooltip} />
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className={`text-2xl font-bold ${valueClassName}`}>{value}</p>
                <p className={`mt-1 flex items-center gap-1 text-xs ${helperClassName}`}>
                    {Icon && <Icon className="size-3" />}
                    {helper}
                </p>
            </CardContent>
        </Card>
    );

    return href ? (
        <Link href={href} className="block">
            {card}
        </Link>
    ) : (
        card
    );
}
