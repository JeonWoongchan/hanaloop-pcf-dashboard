// 존재하지 않는 경로 접근 시 Next.js가 자동으로 렌더링하는 404 페이지

import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center gap-6 py-32 text-center">
            <FileQuestion className="text-muted-foreground h-12 w-12" />
            <div className="flex flex-col gap-2">
                <h2 className="text-foreground text-xl font-semibold">페이지를 찾을 수 없습니다</h2>
                <p className="text-muted-foreground text-sm">
                    요청하신 주소가 존재하지 않거나 이동되었습니다.
                </p>
            </div>
            <Button asChild variant="outline">
                <Link href="/">대시보드로 돌아가기</Link>
            </Button>
        </div>
    );
}
