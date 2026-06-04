'use client';

// 삭제 확인 버튼 — 클릭 시 AlertDialog 모달로 확인 요청
// 모달 없이 행·카드 내에서 삭제를 확정하는 공통 패턴

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

type Props = {
    onConfirmAction: () => void;
    disabled?: boolean;
    title?: string;
    description?: string;
};

export function DeleteConfirmButton({
    onConfirmAction,
    disabled,
    title = '삭제하겠습니까?',
    description = '이 작업은 되돌릴 수 없습니다.',
}: Props) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button
                size="icon"
                variant="ghost"
                className="text-muted-foreground hover:text-destructive size-7"
                disabled={disabled}
                onClick={() => setOpen(true)}
                aria-label="삭제"
            >
                <Trash2 className="size-3.5" />
            </Button>

            <AlertDialog open={open} onOpenChange={setOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{title}</AlertDialogTitle>
                        <AlertDialogDescription>{description}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                onConfirmAction();
                                setOpen(false);
                            }}
                            disabled={disabled}
                            className="bg-destructive hover:bg-destructive/90 text-white"
                        >
                            {disabled ? '삭제 중...' : '삭제'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
