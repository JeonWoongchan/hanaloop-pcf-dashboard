'use client';

// 포스트 작성·수정 다이얼로그 — 낙관적 업데이트 + 실패 토스트

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useSavePost } from '@/hooks/posts/usePosts';
import type { Post } from '@/types';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

const postSchema = z.object({
    title: z.string().min(1, '제목을 입력해 주세요.'),
    dateTime: z
        .string()
        .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'YYYY-MM 형식으로 입력해 주세요.'),
    author: z.string().min(1, '작성자를 입력해 주세요.'),
    content: z.string().min(1, '내용을 입력해 주세요.'),
});

type PostFormData = z.infer<typeof postSchema>;
type FieldErrors = Partial<Record<keyof PostFormData, string>>;

const EMPTY: PostFormData = { title: '', dateTime: '', author: '', content: '' };

function toMonthValue(dateTime: string): string {
    return dateTime.slice(0, 7);
}

// 라벨 + 입력 + 에러 메시지를 묶는 폼 필드 래퍼
function FormField({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <label className="text-sm font-medium">{label}</label>
            {children}
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}

type Props = {
    companyId: string;
    post?: Post;
    open: boolean;
    onCloseAction: () => void;
};

// 포스트 작성·수정 폼 다이얼로그 렌더링
export function PostFormDialog({ companyId, post, open, onCloseAction }: Props) {
    const [form, setForm] = useState<PostFormData>(EMPTY);
    const [errors, setErrors] = useState<FieldErrors>({});
    const { mutate: savePost, isPending } = useSavePost();

    // 다이얼로그 열릴 때 편집 데이터 또는 빈 폼으로 초기화
    useEffect(() => {
        if (open) {
            /* eslint-disable react-hooks/set-state-in-effect */
            setForm(
                post
                    ? {
                        title: post.title,
                        dateTime: toMonthValue(post.dateTime),
                        author: post.author,
                        content: post.content,
                    }
                    : EMPTY
            );
            setErrors({});
            /* eslint-enable react-hooks/set-state-in-effect */
        }
    }, [open, post]);

    const handleChange = (field: keyof PostFormData, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const handleSubmit = () => {
        const result = postSchema.safeParse(form);
        if (!result.success) {
            const fieldErrors: FieldErrors = {};
            result.error.issues.forEach((issue) => {
                const field = issue.path[0] as keyof PostFormData;
                if (!fieldErrors[field]) fieldErrors[field] = issue.message;
            });
            setErrors(fieldErrors);
            return;
        }

        savePost(
            { ...result.data, resourceUid: companyId, ...(post?.id && { id: post.id }) },
            {
                onSuccess: () => {
                    toast.success(post ? '수정됐습니다.' : '포스트가 작성됐습니다.');
                    onCloseAction();
                },
                // 훅의 onError가 낙관적 업데이트 롤백, 여기서는 토스트만 표시
                onError: (error) =>
                    toast.error(error instanceof Error ? error.message : '저장에 실패했습니다.'),
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onCloseAction()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{post ? '포스트 수정' : '새 포스트 작성'}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <FormField label="제목" error={errors.title}>
                        <Input
                            value={form.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            placeholder="포스트 제목"
                            disabled={isPending}
                        />
                    </FormField>

                    <FormField label="기준 월" error={errors.dateTime}>
                        <Input
                            type="month"
                            value={form.dateTime}
                            onChange={(e) => handleChange('dateTime', e.target.value)}
                            disabled={isPending}
                        />
                    </FormField>

                    <FormField label="작성자" error={errors.author}>
                        <Input
                            value={form.author}
                            onChange={(e) => handleChange('author', e.target.value)}
                            placeholder="작성자 이름"
                            disabled={isPending}
                        />
                    </FormField>

                    <FormField label="내용" error={errors.content}>
                        <Textarea
                            value={form.content}
                            onChange={(e) => handleChange('content', e.target.value)}
                            placeholder="포스트 내용을 입력해 주세요."
                            rows={4}
                            disabled={isPending}
                        />
                    </FormField>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onCloseAction} disabled={isPending}>
                        취소
                    </Button>
                    <Button onClick={handleSubmit} disabled={isPending}>
                        {isPending ? '저장 중...' : '저장'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
