'use client';
// 카드/차트 제목 옆 i 아이콘 도움말 툴팁
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

// providers.tsx의 전역 TooltipProvider를 사용하므로 별도 Provider 불필요
export function InfoTooltip({ content }: { content: string }) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground ml-1.5 inline-flex shrink-0 items-center transition-colors"
                    aria-label="도움말"
                >
                    <Info className="size-3.5" />
                </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-64 leading-relaxed whitespace-pre-line">
                {content}
            </TooltipContent>
        </Tooltip>
    );
}
