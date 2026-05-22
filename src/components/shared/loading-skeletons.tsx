import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type MetricGridSkeletonProps = {
    count?: number;
    className?: string;
    itemClassName?: string;
};

type BlockSkeletonProps = {
    className?: string;
};

type RepeatedSkeletonProps = {
    count?: number;
    className?: string;
    itemClassName?: string;
};

export function MetricGridSkeleton({
    count = 4,
    className,
    itemClassName,
}: MetricGridSkeletonProps) {
    return (
        <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4', className)}>
            {Array.from({ length: count }).map((_, i) => (
                <Skeleton key={i} className={cn('h-28 rounded-xl', itemClassName)} />
            ))}
        </div>
    );
}

export function ChartSkeleton({ className }: BlockSkeletonProps) {
    return <Skeleton className={cn('h-72 rounded-xl', className)} />;
}

export function CardGridSkeleton({ count = 6, className, itemClassName }: RepeatedSkeletonProps) {
    return (
        <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}>
            {Array.from({ length: count }).map((_, i) => (
                <Skeleton key={i} className={cn('h-52 rounded-xl', itemClassName)} />
            ))}
        </div>
    );
}

export function ListSkeleton({ count = 2, className, itemClassName }: RepeatedSkeletonProps) {
    return (
        <div className={cn('space-y-3', className)}>
            {Array.from({ length: count }).map((_, i) => (
                <Skeleton key={i} className={cn('h-24 rounded-lg', itemClassName)} />
            ))}
        </div>
    );
}
