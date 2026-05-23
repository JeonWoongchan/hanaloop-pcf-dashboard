import {
    ACTION_NOTE_AUTHOR_MAX_LENGTH,
    ACTION_NOTE_CONTENT_MAX_LENGTH,
    AUTHOR_STORAGE_KEY,
    POST_TITLE_MAX_LENGTH,
} from '@/constants/posts';
import { useDeletePost, usePostsByCompany, useSavePost } from '@/hooks/posts/usePosts';
import { getErrorMessage } from '@/lib/errors';
import { formatNowToDateTime } from '@/lib/format';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { toast } from 'sonner';

type EditingState = { id: string; content: string };
type DraftTouchedState = { author: boolean; content: boolean };
type NewNoteErrors = { author?: string; content?: string };

type DraftValidation = {
    errors: NewNoteErrors;
    isValid: boolean;
    trimmedAuthor: string;
    trimmedContent: string;
};

const EMPTY_DRAFT_TOUCHED: DraftTouchedState = { author: false, content: false };
const SUBMITTED_DRAFT_TOUCHED: DraftTouchedState = { author: true, content: true };

const REQUIRED_AUTHOR_MESSAGE = '작성자를 입력해 주세요.';
const REQUIRED_CONTENT_MESSAGE = '메모 내용을 입력해 주세요.';
const REQUIRED_EDIT_CONTENT_MESSAGE = '수정할 내용을 입력해 주세요.';
const AUTHOR_LENGTH_MESSAGE = `작성자는 ${ACTION_NOTE_AUTHOR_MAX_LENGTH}자 이내로 입력해 주세요.`;
const CONTENT_LENGTH_MESSAGE = `메모는 ${ACTION_NOTE_CONTENT_MAX_LENGTH}자 이내로 입력해 주세요.`;
const EDIT_CONTENT_LENGTH_MESSAGE = `수정할 내용은 ${ACTION_NOTE_CONTENT_MAX_LENGTH}자 이내로 입력해 주세요.`;

function getDraftAuthorError(value: string, shouldShow: boolean) {
    if (!shouldShow) return undefined;
    if (!value) return REQUIRED_AUTHOR_MESSAGE;
    if (value.length > ACTION_NOTE_AUTHOR_MAX_LENGTH) return AUTHOR_LENGTH_MESSAGE;
    return undefined;
}

function getDraftContentError(value: string, shouldShow: boolean) {
    if (!shouldShow) return undefined;
    if (!value) return REQUIRED_CONTENT_MESSAGE;
    if (value.length > ACTION_NOTE_CONTENT_MAX_LENGTH) return CONTENT_LENGTH_MESSAGE;
    return undefined;
}

function validateDraftNote(
    author: string,
    content: string,
    touched: DraftTouchedState
): DraftValidation {
    const trimmedAuthor = author.trim();
    const trimmedContent = content.trim();

    return {
        errors: {
            author: getDraftAuthorError(trimmedAuthor, touched.author),
            content: getDraftContentError(trimmedContent, touched.content),
        },
        isValid:
            Boolean(trimmedAuthor && trimmedContent) &&
            trimmedAuthor.length <= ACTION_NOTE_AUTHOR_MAX_LENGTH &&
            trimmedContent.length <= ACTION_NOTE_CONTENT_MAX_LENGTH,
        trimmedAuthor,
        trimmedContent,
    };
}

function getEditContentError(editingState: EditingState | null, touched: boolean) {
    if (!editingState || !touched) {
        return undefined;
    }

    const trimmedContent = editingState.content.trim();
    if (!trimmedContent) return REQUIRED_EDIT_CONTENT_MESSAGE;
    if (trimmedContent.length > ACTION_NOTE_CONTENT_MAX_LENGTH) {
        return EDIT_CONTENT_LENGTH_MESSAGE;
    }

    return undefined;
}

export function useActionNotes(companyId: string) {
    const [open, setOpen] = useState(false);
    const [content, setContent] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [editingState, setEditingState] = useState<EditingState | null>(null);
    const [draftTouched, setDraftTouched] = useState<DraftTouchedState>(EMPTY_DRAFT_TOUCHED);
    const [editTouched, setEditTouched] = useState(false);
    const [author, setAuthor] = useState(() =>
        typeof window !== 'undefined' ? (localStorage.getItem(AUTHOR_STORAGE_KEY) ?? '') : ''
    );
    const bottomRef = useRef<HTMLDivElement>(null);
    const prevLengthRef = useRef(0);

    const { data: posts, isLoading, isFetching, error, refetch } = usePostsByCompany(companyId);
    const { mutate: createPost, isPending: isCreating } = useSavePost();
    const { mutate: updatePost, isPending: isUpdating } = useSavePost();
    const { mutate: deletePost, isPending: isDeleting } = useDeletePost();

    const sortedPosts = useMemo(
        () => [...(posts ?? [])].sort((a, b) => a.dateTime.localeCompare(b.dateTime)),
        [posts]
    );

    useEffect(() => {
        if (open) {
            bottomRef.current?.scrollIntoView({ behavior: 'instant' });
        }
    }, [open]);

    useEffect(() => {
        const currentLength = posts?.length ?? 0;

        if (open && currentLength > prevLengthRef.current) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }

        prevLengthRef.current = currentLength;
    }, [open, posts?.length]);

    const draftValidation = validateDraftNote(author, content, draftTouched);
    const newNoteErrors = draftValidation.errors;
    const editContentError = getEditContentError(editingState, editTouched);

    const resetDraft = () => {
        setContent('');
        setDraftTouched(EMPTY_DRAFT_TOUCHED);
    };

    const resetEdit = () => {
        setEditingState(null);
        setEditTouched(false);
    };

    const handleAuthorChange = (value: string) => {
        setDraftTouched((prev) => ({ ...prev, author: true }));
        setAuthor(value);
        localStorage.setItem(AUTHOR_STORAGE_KEY, value);
    };

    const handleContentChange = (value: string) => {
        setDraftTouched((prev) => ({ ...prev, content: true }));
        setContent(value);
    };

    const handleSend = () => {
        setDraftTouched(SUBMITTED_DRAFT_TOUCHED);

        const validation = validateDraftNote(author, content, SUBMITTED_DRAFT_TOUCHED);
        if (!validation.isValid) return;

        createPost(
            {
                resourceUid: companyId,
                title: validation.trimmedContent.slice(0, POST_TITLE_MAX_LENGTH),
                content: validation.trimmedContent,
                dateTime: formatNowToDateTime(),
                author: validation.trimmedAuthor,
            },
            {
                onSuccess: () => {
                    resetDraft();
                    toast.success('메모를 작성했습니다.');
                },
                onError: (e) => toast.error(getErrorMessage(e, '저장에 실패했습니다.')),
            }
        );
    };

    const startEdit = (post: EditingState) => {
        setEditingState({ id: post.id, content: post.content });
        setEditTouched(false);
    };

    const cancelEdit = () => {
        resetEdit();
    };

    const handleEditContentChange = (value: string) => {
        setEditTouched(true);
        setEditingState((prev) => (prev ? { ...prev, content: value } : null));
    };

    const handleSaveEdit = () => {
        if (!editingState) return;
        setEditTouched(true);

        const trimmedContent = editingState.content.trim();
        if (!trimmedContent) return;
        if (trimmedContent.length > ACTION_NOTE_CONTENT_MAX_LENGTH) return;

        const originalPost = sortedPosts.find((p) => p.id === editingState.id);
        if (!originalPost) return;

        updatePost(
            {
                ...originalPost,
                content: trimmedContent,
                title: trimmedContent.slice(0, POST_TITLE_MAX_LENGTH),
            },
            {
                onSuccess: () => {
                    resetEdit();
                    toast.success('수정됐습니다.');
                },
                onError: (e) => toast.error(getErrorMessage(e, '저장에 실패했습니다.')),
            }
        );
    };

    const confirmDelete = () => {
        if (!deletingId) return;

        deletePost(deletingId, {
            onSuccess: () => toast.success('삭제됐습니다.'),
            onError: (e) => toast.error(getErrorMessage(e, '삭제에 실패했습니다.')),
            onSettled: () => setDeletingId(null),
        });
    };

    const handleNewKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleEditKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSaveEdit();
        }

        if (e.key === 'Escape') {
            cancelEdit();
        }
    };

    return {
        open,
        setOpen,
        content,
        setContent,
        newNoteErrors,
        author,
        deletingId,
        setDeletingId,
        editingState,
        setEditingState,
        editContentError,
        posts,
        isLoading,
        isFetching,
        error,
        refetch,
        sortedPosts,
        isCreating,
        isUpdating,
        isDeleting,
        bottomRef,
        handleAuthorChange,
        handleContentChange,
        handleSend,
        startEdit,
        cancelEdit,
        handleEditContentChange,
        handleSaveEdit,
        confirmDelete,
        handleNewKeyDown,
        handleEditKeyDown,
    };
}
