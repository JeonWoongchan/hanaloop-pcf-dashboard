// Action Notes 패널 상태·핸들러 — 컴포넌트에서 로직 분리

import { AUTHOR_STORAGE_KEY, POST_TITLE_MAX_LENGTH } from '@/constants/posts';
import { useDeletePost, usePostsByCompany, useSavePost } from '@/hooks/posts/usePosts';
import { formatNowToDateTime } from '@/lib/format';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

type EditingState = { id: string; content: string };

export function useActionNotes(companyId: string) {
    const [open, setOpen] = useState(false);
    const [content, setContent] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);
    // 편집 중인 포스트 id·내용을 단일 객체로 관리 — null이면 편집 없음
    const [editingState, setEditingState] = useState<EditingState | null>(null);
    // localStorage에서 이름 복원 — lazy initializer로 초기 렌더에만 실행
    const [author, setAuthor] = useState(() =>
        typeof window !== 'undefined' ? (localStorage.getItem(AUTHOR_STORAGE_KEY) ?? '') : ''
    );
    const bottomRef = useRef<HTMLDivElement>(null);

    const { data: posts, isLoading } = usePostsByCompany(companyId);
    // 작성·수정 mutation을 분리해 isPending이 서로 영향을 주지 않도록 함
    const { mutate: createPost, isPending: isCreating } = useSavePost();
    const { mutate: updatePost, isPending: isUpdating } = useSavePost();
    const { mutate: deletePost, isPending: isDeleting } = useDeletePost();

    // 작성일 오름차순 — posts 참조가 바뀔 때만 재계산
    const sortedPosts = useMemo(
        () => [...(posts ?? [])].sort((a, b) => a.dateTime.localeCompare(b.dateTime)),
        [posts]
    );

    // 패널 열릴 때 즉시 최하단 스크롤
    useEffect(() => {
        if (open) {
            bottomRef.current?.scrollIntoView({ behavior: 'instant' });
        }
    }, [open]);

    // 패널이 열린 상태에서 새 포스트 추가 시 부드럽게 최하단 스크롤
    const prevLengthRef = useRef(posts?.length ?? 0);
    useEffect(() => {
        if (open && (posts?.length ?? 0) > prevLengthRef.current) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
        prevLengthRef.current = posts?.length ?? 0;
    }, [open, posts?.length]);

    const handleAuthorChange = (value: string) => {
        setAuthor(value);
        localStorage.setItem(AUTHOR_STORAGE_KEY, value);
    };

    const handleSend = () => {
        const trimmedContent = content.trim();
        const trimmedAuthor = author.trim();
        if (!trimmedContent || !trimmedAuthor) return;

        createPost(
            {
                resourceUid: companyId,
                title: trimmedContent.slice(0, POST_TITLE_MAX_LENGTH),
                content: trimmedContent,
                dateTime: formatNowToDateTime(),
                author: trimmedAuthor,
            },
            {
                onSuccess: () => {
                    setContent('');
                    toast.success('메모를 작성했습니다.');
                },
                onError: (e) =>
                    toast.error(e instanceof Error ? e.message : '저장에 실패했습니다.'),
            }
        );
    };

    const startEdit = (post: EditingState) =>
        setEditingState({ id: post.id, content: post.content });

    const cancelEdit = () => setEditingState(null);

    const handleSaveEdit = () => {
        if (!editingState) return;
        const trimmed = editingState.content.trim();
        if (!trimmed) return;

        const originalPost = sortedPosts.find((p) => p.id === editingState.id);
        if (!originalPost) return;

        updatePost(
            { ...originalPost, content: trimmed, title: trimmed.slice(0, POST_TITLE_MAX_LENGTH) },
            {
                onSuccess: () => {
                    cancelEdit();
                    toast.success('수정됐습니다.');
                },
                onError: (e) =>
                    toast.error(e instanceof Error ? e.message : '저장에 실패했습니다.'),
            }
        );
    };

    const confirmDelete = () => {
        if (!deletingId) return;
        deletePost(deletingId, {
            onSuccess: () => toast.success('삭제됐습니다.'),
            onError: (e) =>
                toast.error(e instanceof Error ? e.message : '삭제에 실패했습니다.'),
            onSettled: () => setDeletingId(null),
        });
    };

    const handleNewKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSaveEdit();
        }
        if (e.key === 'Escape') cancelEdit();
    };

    return {
        // 상태
        open, setOpen,
        content, setContent,
        author,
        deletingId, setDeletingId,
        editingState, setEditingState,
        // 데이터
        posts,
        isLoading,
        sortedPosts,
        // 로딩 상태
        isCreating,
        isUpdating,
        isDeleting,
        // ref
        bottomRef,
        // 핸들러
        handleAuthorChange,
        handleSend,
        startEdit,
        cancelEdit,
        handleSaveEdit,
        confirmDelete,
        handleNewKeyDown,
        handleEditKeyDown,
    };
}
