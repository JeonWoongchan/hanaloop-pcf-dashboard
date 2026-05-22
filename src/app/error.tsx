'use client';
// 런타임 에러 발생 시 Next.js가 자동으로 렌더링하는 에러 바운더리

import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

type Props = {
    error: Error & { digest?: string };
    reset: () => void;
};

export default function Error({ error, reset }: Props) {
    useEffect(() => {
        // 에러 모니터링 연동 시 이 위치에서 리포팅
        console.error(error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center gap-6 py-32 text-center">
            <AlertTriangle className="text-destructive h-12 w-12" />
            <div className="flex flex-col gap-2">
                <h2 className="text-foreground text-xl font-semibold">오류가 발생했습니다</h2>
                <p className="text-muted-foreground text-sm">
                    {error.message || '알 수 없는 오류입니다. 잠시 후 다시 시도해 주세요.'}
                </p>
            </div>
            <Button variant="outline" onClick={reset}>
                다시 시도
            </Button>
        </div>
    );
}
