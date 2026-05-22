'use client';

// 개별 포스트 카드 — 수정·삭제 액션 포함

import { Button } from '@/components/ui/button';
import { useDeletePost } from '@/hooks/posts/usePosts';
import { formatYearMonth } from '@/lib/format';
import type { Post } from '@/types';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

type Props = {
    post: Post;
    onEditAction: (post: Post) => void;
};

// 포스트 내용 및 수정·삭제 버튼 렌더링
export function PostCard({ post, onEditAction }: Props) {
    const { mutate: deletePost, isPending } = useDeletePost();

    const handleDelete = () => {
        deletePost(post.id, {
            onSuccess: () => toast.success('삭제됐습니다.'),
            // 훅의 onError가 롤백 처리, 여기서는 토스트만 표시
            onError: (error) =>
                toast.error(error instanceof Error ? error.message : '삭제에 실패했습니다.'),
        });
    };

    return (
        <div className="bg-card space-y-2 rounded-lg border p-4">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="truncate leading-tight font-medium">{post.title}</p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                        {formatYearMonth(post.dateTime)}
                    </p>
                </div>
                <div className="flex shrink-0 gap-1">
                    <Button
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        onClick={() => onEditAction(post)}
                        disabled={isPending}
                        aria-label="포스트 수정"
                    >
                        <Pencil className="size-3.5" />
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive size-7"
                        onClick={handleDelete}
                        disabled={isPending}
                        aria-label="포스트 삭제"
                    >
                        <Trash2 className="size-3.5" />
                    </Button>
                </div>
            </div>
            <p className="text-muted-foreground line-clamp-2 text-sm">{post.content}</p>
        </div>
    );
}
