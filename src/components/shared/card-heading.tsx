// 카드 헤더 공통 패턴 — 제목 + 도움말(선택) + 설명(선택) + 우측 액션(선택)

import { InfoTooltip } from '@/components/shared/info-tooltip';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ReactNode } from 'react';

type Props = {
    title: ReactNode;
    tooltip?: string;
    description?: ReactNode;
    // 헤더 우측 영역 — 탭, 링크 등
    action?: ReactNode;
    // CardHeader에 전달할 className (예: "pb-2", "pb-3")
    className?: string;
    // CardTitle 추가 클래스 (예: KPI 카드의 "text-sm font-medium text-muted-foreground")
    titleClassName?: string;
};

export function CardHeading({
    title,
    tooltip,
    description,
    action,
    className,
    titleClassName,
}: Props) {
    const titleNode = (
        <CardTitle className={`flex items-center${titleClassName ? ` ${titleClassName}` : ''}`}>
            {title}
            {tooltip && <InfoTooltip content={tooltip} />}
        </CardTitle>
    );

    const descNode = description !== undefined && description !== null && (
        <CardDescription>{description}</CardDescription>
    );

    return (
        <CardHeader className={className}>
            {action ? (
                <div className="flex items-center justify-between gap-4">
                    <div>
                        {titleNode}
                        {descNode}
                    </div>
                    {action}
                </div>
            ) : (
                <>
                    {titleNode}
                    {descNode}
                </>
            )}
        </CardHeader>
    );
}
