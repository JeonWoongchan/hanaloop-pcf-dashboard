import type { ReactNode } from 'react';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';

type Props = {
    isLoading: boolean;
    error?: unknown;
    isEmpty?: boolean;
    loadingFallback: ReactNode;
    errorFallback?: ReactNode;
    emptyFallback?: ReactNode;
    errorMessage?: string;
    emptyMessage?: string;
    onRetry?: () => void;
    children: ReactNode;
};

// 조회형 화면의 loading/error/empty/success 분기를 한곳에서 처리한다.
export function AsyncStateBoundary({
    isLoading,
    error,
    isEmpty = false,
    loadingFallback,
    errorFallback,
    emptyFallback,
    errorMessage,
    emptyMessage,
    onRetry,
    children,
}: Props) {
    if (isLoading) return <>{loadingFallback}</>;

    if (error) {
        if (errorFallback) return <>{errorFallback}</>;
        return <ErrorState message={errorMessage} onRetry={onRetry} />;
    }

    if (isEmpty) {
        return <>{emptyFallback ?? <EmptyState message={emptyMessage} />}</>;
    }

    return <>{children}</>;
}
