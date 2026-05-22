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
        open, setOpen,
        content, setContent,
        author,
        deletingId, setDeletingId,
        editingState, setEditingState,
        posts,
        isLoading,
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
                            className="bg-destructive text-white hover:bg-destructive/90"
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
                    className="cursor-pointer fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-primary px-5 py-6 text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                    aria-label="Action Notes 열기"
                >
                    <MessageCircle className="size-5 shrink-0" />
                    <span className="text-sm font-medium leading-none">Action Notes</span>
                    {posts && posts.length > 0 && (
                        <span className="flex size-5 items-center justify-center rounded-full bg-destructive text-xs text-white">
                            {posts.length}
                        </span>
                    )}
                </Button>
            )}

            {/* 패널 */}
            {open && (
                <div className="fixed bottom-6 right-6 z-50 flex w-80 lg:w-140 h-140 flex-col rounded-2xl border bg-card shadow-2xl">
                    {/* 헤더 */}
                    <div className="flex items-center justify-between border-b px-4 py-3">
                        <div>
                            <p className="font-semibold">Action Notes</p>
                            <p className="text-xs text-muted-foreground">
                                대응 기록 및 감축 조치 메모
                            </p>
                        </div>
                        <button
                            onClick={() => setOpen(false)}
                            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                            aria-label="닫기"
                        >
                            <X className="size-4" />
                        </button>
                    </div>

                    {/* 메모 목록 */}
                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                        {isLoading && (
                            <p className="py-8 text-center text-sm text-muted-foreground">
                                불러오는 중...
                            </p>
                        )}
                        {!isLoading && sortedPosts.length === 0 && (
                            <p className="py-8 text-center text-sm text-muted-foreground">
                                아직 작성된 Action Notes가 없습니다.
                            </p>
                        )}
                        {sortedPosts.map((post) => {
                            const isEditing = editingState?.id === post.id;
                            return (
                                <div key={post.id} className="rounded-lg border bg-card p-3 space-y-1.5">
                                    {/* 작성자·날짜 + 수정·삭제 버튼 */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <span className="text-xs font-medium">{post.author}</span>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDateTime(post.dateTime)}
                                            </p>
                                        </div>
                                        {!isEditing && (
                                            <div className="flex shrink-0 items-center gap-0.5">
                                                <button
                                                    onClick={() => startEdit(post)}
                                                    className="rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                                                    aria-label="수정"
                                                >
                                                    <Pencil className="size-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => setDeletingId(post.id)}
                                                    className="rounded p-0.5 text-muted-foreground transition-colors hover:text-destructive"
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
                                                        prev ? { ...prev, content: e.target.value } : null
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
                                                    disabled={isUpdating || !editingState.content.trim()}
                                                >
                                                    <Check className="mr-1 size-3" />
                                                    저장
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap break-words">
                                            {post.content}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                        <div ref={bottomRef} />
                    </div>

                    {/* 입력 영역 */}
                    <div className="border-t p-3 space-y-2">
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
                        <p className="text-xs text-muted-foreground">
                            Enter 전송 · Shift+Enter 줄바꿈
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}
