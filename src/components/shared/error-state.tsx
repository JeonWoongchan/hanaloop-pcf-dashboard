// 데이터 패칭 실패 시 공통 에러 안내 및 재시도 버튼

import { Button } from '@/components/ui/button';

type Props = {
    message?: string;
    onRetry?: () => void;
};

// 에러 메시지와 재시도 버튼 렌더링
export function ErrorState({ message = '데이터를 불러오지 못했습니다.', onRetry }: Props) {
    return (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <p className="text-muted-foreground">{message}</p>
            {onRetry && (
                <Button variant="outline" onClick={() => onRetry()}>
                    다시 시도
                </Button>
            )}
        </div>
    );
}
