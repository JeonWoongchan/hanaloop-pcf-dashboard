'use client';

// 회사별 포스트 목록 및 CRUD 인터랙션 구성

import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePostsByCompany } from '@/hooks/posts/usePosts';
import type { Post } from '@/types';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { PostCard } from './post-card';
import { PostFormDialog } from './post-form-dialog';

type Props = {
    companyId: string;
};

// 포스트 목록 + 작성·수정 다이얼로그 렌더링
export function CompanyPosts({ companyId }: Props) {
    const { data: posts, isLoading, error, refetch } = usePostsByCompany(companyId);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingPost, setEditingPost] = useState<Post | undefined>(undefined);

    const handleEdit = (post: Post) => {
        setEditingPost(post);
        setDialogOpen(true);
    };

    const handleNew = () => {
        setEditingPost(undefined);
        setDialogOpen(true);
    };

    const handleClose = () => {
        setDialogOpen(false);
        setEditingPost(undefined);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">포스트</h3>
                <Button size="sm" onClick={handleNew}>
                    <Plus className="mr-1.5 size-4" />새 포스트
                </Button>
            </div>

            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2].map((i) => (
                        <Skeleton key={i} className="h-24 rounded-lg" />
                    ))}
                </div>
            ) : error ? (
                <ErrorState onRetry={refetch} message="포스트를 불러오지 못했습니다." />
            ) : !posts?.length ? (
                <EmptyState message="아직 포스트가 없습니다." />
            ) : (
                <div className="space-y-3">
                    {posts.map((post) => (
                        <PostCard key={post.id} post={post} onEditAction={handleEdit} />
                    ))}
                </div>
            )}

            <PostFormDialog
                companyId={companyId}
                post={editingPost}
                open={dialogOpen}
                onCloseAction={handleClose}
            />
        </div>
    );
}
