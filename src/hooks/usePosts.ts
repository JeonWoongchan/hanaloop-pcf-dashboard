import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createOrUpdatePost, deletePost, fetchPosts } from '@/lib/api';
import { queryKeys } from './queryKeys';
import type { Post } from '@/types';

export function usePosts() {
    return useQuery({
        queryKey: queryKeys.posts.all,
        queryFn: fetchPosts,
    });
}

// 전체 목록을 캐시에서 필터링 — 회사별 별도 fetch 불필요
export function usePostsByCompany(companyId: string) {
    const { data: posts, ...rest } = usePosts();
    return {
        data: posts?.filter((p) => p.resourceUid === companyId),
        ...rest,
    };
}

export function useSavePost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (post: Omit<Post, 'id'> & { id?: string }) => createOrUpdatePost(post),
        onMutate: async (newPost) => {
            // 진행 중인 refetch 취소하여 낙관적 업데이트가 덮어쓰여지는 것 방지
            await queryClient.cancelQueries({ queryKey: queryKeys.posts.all });
            const previousPosts = queryClient.getQueryData<Post[]>(queryKeys.posts.all);

            // 서버 응답 전에 UI를 먼저 업데이트 (낙관적 업데이트)
            queryClient.setQueryData<Post[]>(queryKeys.posts.all, (old = []) => {
                if (newPost.id) {
                    return old.map((p) => (p.id === newPost.id ? { ...p, ...newPost } : p));
                }
                return [...old, { ...newPost, id: `temp-${Date.now()}` }];
            });

            return { previousPosts };
        },
        onError: (_err, _newPost, context) => {
            // 실패 시 낙관적 업데이트 롤백
            if (context?.previousPosts) {
                queryClient.setQueryData(queryKeys.posts.all, context.previousPosts);
            }
        },
        onSettled: () => {
            // 성공·실패 관계없이 서버 상태와 동기화
            queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
        },
    });
}

export function useDeletePost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deletePost(id),
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.posts.all });
            const previousPosts = queryClient.getQueryData<Post[]>(queryKeys.posts.all);

            // 삭제 항목을 미리 제거 (낙관적 업데이트)
            queryClient.setQueryData<Post[]>(queryKeys.posts.all, (old = []) =>
                old.filter((p) => p.id !== id)
            );

            return { previousPosts };
        },
        onError: (_err, _id, context) => {
            if (context?.previousPosts) {
                queryClient.setQueryData(queryKeys.posts.all, context.previousPosts);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
        },
    });
}
