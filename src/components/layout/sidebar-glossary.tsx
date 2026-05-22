'use client';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { SIDEBAR_GLOSSARY_TERMS } from '@/constants/glossary';
import { Info } from 'lucide-react';

export function SidebarGlossary() {
    return (
        <section className="space-y-2 group-data-[collapsible=icon]:hidden">
            <div className="text-sidebar-foreground/70 flex items-center gap-1.5 px-1 text-xs font-medium">
                <Info className="size-3.5" />
                <span>용어 도움말</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
                {SIDEBAR_GLOSSARY_TERMS.map((item) => (
                    <Tooltip key={item.term}>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                className="border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-sidebar-ring inline-flex h-7 items-center gap-1 rounded-md border px-2 text-xs font-medium outline-hidden transition-colors focus-visible:ring-2"
                            >
                                <Info className="size-3" />
                                <span>{item.term}</span>
                            </button>
                        </TooltipTrigger>
                        <TooltipContent
                            side="right"
                            align="start"
                            sideOffset={12}
                            className="w-80 max-w-80 flex-col items-start gap-2 p-3 text-left leading-relaxed whitespace-normal"
                        >
                            <div>
                                <p className="font-semibold">{item.term}</p>
                                <p className="text-background/80 mt-0.5">{item.title}</p>
                            </div>
                            <p>{item.description}</p>
                            <div className="border-background/15 border-t pt-2">
                                <p className="font-medium">서비스 산정 방식</p>
                                <p className="text-background/85 mt-0.5">{item.method}</p>
                            </div>
                        </TooltipContent>
                    </Tooltip>
                ))}
            </div>
        </section>
    );
}
