'use client';

// Action Notes 플로팅 패널 — 회사별 대응 기록 작성·열람

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
import { CompactState } from '@/components/shared/compact-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useActionNotes } from '@/hooks/posts/useActionNotes';
import { formatDateTime } from '@/lib/format';
import { Check, MessageCircle, Pencil, Send, Trash2, X } from 'lucide-react';

type Props = {
    companyId: string;
};

export function ActionNotesPanel({ companyId }: Props) {
    const {
        open,
        setOpen,
        content,
        setContent,
        author,
        deletingId,
        setDeletingId,
        editingState,
        setEditingState,
        posts,
        isLoading,
        error,
        refetch,
        sortedPosts,
        isCreating,
        isUpdating,
        isDeleting,
        bottomRef,
        handleAuthorChange,
        handleSend,
        startEdit,
        cancelEdit,
        handleSaveEdit,
        confirmDelete,
        handleNewKeyDown,
        handleEditKeyDown,
    } = useActionNotes(companyId);

    return (
        <>
            {/* 삭제 확인 다이얼로그 */}
            <AlertDialog open={!!deletingId} onOpenChange={(v) => !v && setDeletingId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>메모를 삭제하겠습니까?</AlertDialogTitle>
                        <AlertDialogDescription>
                            삭제된 메모는 복구할 수 없습니다.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            disabled={isDeleting}
                            className="bg-destructive hover:bg-destructive/90 text-white"
                        >
                            {isDeleting ? '삭제 중...' : '삭제'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* 플로팅 버튼 */}
            {!open && (
                <Button
                    onClick={() => setOpen(true)}
                    className="bg-primary text-primary-foreground fixed right-6 bottom-6 z-50 flex cursor-pointer items-center gap-2 rounded-full px-5 py-6 shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                    aria-label="Action Notes 열기"
                >
                    <MessageCircle className="size-5 shrink-0" />
                    <span className="text-sm leading-none font-medium">Action Notes</span>
                    {posts && posts.length > 0 && (
                        <span className="bg-destructive flex size-5 items-center justify-center rounded-full text-xs text-white">
                            {posts.length}
                        </span>
                    )}
                </Button>
            )}

            {/* 패널 */}
            {open && (
                <div className="bg-card fixed right-6 bottom-6 z-50 flex h-140 w-80 flex-col rounded-2xl border shadow-2xl lg:w-140">
                    {/* 헤더 */}
                    <div className="flex items-center justify-between border-b px-4 py-3">
                        <div>
                            <p className="font-semibold">Action Notes</p>
                            <p className="text-muted-foreground text-xs">
                                대응 기록 및 감축 조치 메모
                            </p>
                        </div>
                        <button
                            onClick={() => setOpen(false)}
                            className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-md p-1 transition-colors"
                            aria-label="닫기"
                        >
                            <X className="size-4" />
                        </button>
                    </div>

                    {/* 메모 목록 */}
                    <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
                        {isLoading && <CompactState message="불러오는 중..." />}
                        {!isLoading && error && (
                            <CompactState
                                message="Action Notes를 불러오지 못했습니다."
                                actionLabel="다시 시도"
                                onAction={() => void refetch()}
                            />
                        )}
                        {!isLoading && !error && sortedPosts.length === 0 && (
                            <CompactState message="아직 작성된 Action Notes가 없습니다." />
                        )}
                        {sortedPosts.map((post) => {
                            const isEditing = editingState?.id === post.id;
                            return (
                                <div
                                    key={post.id}
                                    className="bg-card space-y-1.5 rounded-lg border p-3"
                                >
                                    {/* 작성자·날짜 + 수정·삭제 버튼 */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <span className="text-xs font-medium">
                                                {post.author}
                                            </span>
                                            <p className="text-muted-foreground text-xs">
                                                {formatDateTime(post.dateTime)}
                                            </p>
                                        </div>
                                        {!isEditing && (
                                            <div className="flex shrink-0 items-center gap-0.5">
                                                <button
                                                    onClick={() => startEdit(post)}
                                                    className="text-muted-foreground hover:text-foreground rounded p-0.5 transition-colors"
                                                    aria-label="수정"
                                                >
                                                    <Pencil className="size-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => setDeletingId(post.id)}
                                                    className="text-muted-foreground hover:text-destructive rounded p-0.5 transition-colors"
                                                    aria-label="삭제"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* 본문: 보기 / 인라인 편집 전환 */}
                                    {isEditing ? (
                                        <div className="space-y-2">
                                            <Textarea
                                                value={editingState.content}
                                                onChange={(e) =>
                                                    setEditingState((prev) =>
                                                        prev
                                                            ? { ...prev, content: e.target.value }
                                                            : null
                                                    )
                                                }
                                                onKeyDown={handleEditKeyDown}
                                                rows={3}
                                                className="resize-none text-sm"
                                                disabled={isUpdating}
                                                autoFocus
                                            />
                                            <div className="flex justify-end gap-1.5">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-7 px-2 text-xs"
                                                    onClick={cancelEdit}
                                                    disabled={isUpdating}
                                                >
                                                    취소
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="h-7 px-2 text-xs"
                                                    onClick={handleSaveEdit}
                                                    disabled={
                                                        isUpdating || !editingState.content.trim()
                                                    }
                                                >
                                                    <Check className="mr-1 size-3" />
                                                    저장
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-foreground text-sm leading-relaxed break-words whitespace-pre-wrap">
                                            {post.content}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                        <div ref={bottomRef} />
                    </div>

                    {/* 입력 영역 */}
                    <div className="space-y-2 border-t p-3">
                        <Input
                            value={author}
                            onChange={(e) => handleAuthorChange(e.target.value)}
                            placeholder="이름"
                            className="text-sm"
                            disabled={isCreating}
                        />
                        <div className="flex items-end gap-2">
                            <Textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                onKeyDown={handleNewKeyDown}
                                placeholder="대응 조치나 메모를 입력하세요..."
                                rows={2}
                                className="resize-none text-sm"
                                disabled={isCreating}
                            />
                            <Button
                                size="icon"
                                onClick={handleSend}
                                disabled={isCreating || !content.trim() || !author.trim()}
                                className="mb-0.5 shrink-0"
                                aria-label="전송"
                            >
                                <Send className="size-4" />
                            </Button>
                        </div>
                        <p className="text-muted-foreground text-xs">
                            Enter 전송 · Shift+Enter 줄바꿈
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}
