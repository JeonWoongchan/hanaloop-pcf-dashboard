import { SourcesContent } from '@/components/sources/sources-content';
import { Suspense } from 'react';

export default function SourcesPage() {
    return (
        <Suspense>
            <SourcesContent />
        </Suspense>
    );
}
