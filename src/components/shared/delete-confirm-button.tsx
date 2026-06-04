'use client';

// 클릭 → 인라인 확인/취소 전환 방식의 삭제 확인 버튼
// 모달 없이 행·카드 내에서 삭제를 확정하는 공통 패턴

import { useState } from 'react';
import { Check, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
    onConfirm: () => void;
    disabled?: boolean;
    size?: 'sm' | 'default';
};

export function DeleteConfirmButton({ onConfirm, disabled, size = 'sm' }: Props) {
    const [confirming, setConfirming] = useState(false);

    if (confirming) {
        return (
            <div className="flex items-center gap-1">
                <Button
                    size="sm"
                    variant="destructive"
                    className="h-7 px-2 text-xs"
                    disabled={disabled}
                    onClick={() => {
                        onConfirm();
                        setConfirming(false);
                    }}
                >
                    <Check className="mr-1 size-3" />
                    확인
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs"
                    disabled={disabled}
                    onClick={() => setConfirming(false)}
                >
                    <X className="mr-1 size-3" />
                    취소
                </Button>
            </div>
        );
    }

    return (
        <Button
            size={size === 'sm' ? 'icon' : 'default'}
            variant="ghost"
            className="text-muted-foreground hover:text-destructive size-7"
            disabled={disabled}
            onClick={() => setConfirming(true)}
            aria-label="삭제"
        >
            <Trash2 className="size-3.5" />
        </Button>
    );
}
