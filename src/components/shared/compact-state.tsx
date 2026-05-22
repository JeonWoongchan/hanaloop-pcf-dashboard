import { cn } from '@/lib/utils';

type Props = {
    message: string;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
};

// 플로팅 패널이나 작은 목록 안에서 쓰는 compact 상태 안내.
export function CompactState({ message, actionLabel, onAction, className }: Props) {
    return (
        <div className={cn('flex flex-col items-center gap-3 py-8 text-center', className)}>
            <p className="text-muted-foreground text-sm">{message}</p>
            {actionLabel && onAction && (
                <button
                    type="button"
                    onClick={onAction}
                    className="text-primary hover:text-primary/80 text-xs underline underline-offset-2 transition-colors"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
}
