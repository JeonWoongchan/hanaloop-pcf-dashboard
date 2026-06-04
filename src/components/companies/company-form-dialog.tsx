'use client';

// 회사 추가·편집 폼 모달 — 이름·국가 2개 필드

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useCountries } from '@/hooks/countries/useCountries';
import { useCreateCompany, useUpdateCompany } from '@/hooks/companies/useCompanyMutations';

type FormValues = {
    name: string;
    countryCode: string;
};

type EditTarget = { id: string; name: string; countryCode: string };

type Props = {
    open: boolean;
    onOpenChangeAction: (open: boolean) => void;
    editTarget?: EditTarget;
};

export function CompanyFormDialog({ open, onOpenChangeAction, editTarget }: Props) {
    const isEdit = Boolean(editTarget);
    const { data: countries, isLoading: isCountriesLoading } = useCountries();

    const {
        register,
        handleSubmit,
        reset,
        control,
        formState: { errors },
    } = useForm<FormValues>({
        defaultValues: { name: '', countryCode: '' },
    });

    // 편집 모드 진입 시 기존 값으로 폼 초기화
    useEffect(() => {
        if (open) {
            reset(
                editTarget
                    ? { name: editTarget.name, countryCode: editTarget.countryCode }
                    : { name: '', countryCode: '' }
            );
        }
    }, [open, editTarget, reset]);

    const createMutation = useCreateCompany(() => onOpenChangeAction(false));
    const updateMutation = useUpdateCompany(() => onOpenChangeAction(false));
    const isPending = createMutation.isPending || updateMutation.isPending;

    const onSubmit = (values: FormValues) => {
        if (isEdit && editTarget) {
            updateMutation.mutate({ id: editTarget.id, payload: values });
        } else {
            createMutation.mutate(values);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChangeAction}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{isEdit ? '회사 정보 수정' : '회사 추가'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-1.5">
                        <label htmlFor="company-name" className="text-sm font-medium">
                            회사명
                        </label>
                        <Input
                            id="company-name"
                            placeholder="예: CT-045 Corporation"
                            aria-invalid={Boolean(errors.name)}
                            {...register('name', {
                                required: '회사명을 입력해 주세요.',
                                maxLength: { value: 100, message: '100자 이내로 입력해 주세요.' },
                            })}
                        />
                        {errors.name && (
                            <p className="text-destructive text-xs">{errors.name.message}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="company-country" className="text-sm font-medium">
                            국가
                        </label>
                        <Controller
                            control={control}
                            name="countryCode"
                            rules={{ required: '국가를 선택해 주세요.' }}
                            render={({ field }) => (
                                <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    disabled={isCountriesLoading}
                                >
                                    <SelectTrigger
                                        id="company-country"
                                        aria-invalid={Boolean(errors.countryCode)}
                                    >
                                        <SelectValue
                                            placeholder={
                                                isCountriesLoading
                                                    ? '국가 목록 로딩 중…'
                                                    : '국가 선택'
                                            }
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {countries?.map((c) => (
                                            <SelectItem key={c.code} value={c.code}>
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.countryCode && (
                            <p className="text-destructive text-xs">{errors.countryCode.message}</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChangeAction(false)}
                        >
                            취소
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? '저장 중…' : isEdit ? '수정' : '추가'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
