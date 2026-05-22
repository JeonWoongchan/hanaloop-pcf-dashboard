import { apiError } from '@/lib/server/api-response';
import { listActivityRecords } from '@/lib/server/activity-records';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const ACTIVITY_RECORDS_ERROR_MESSAGE = '활동 데이터를 불러오지 못했습니다.';

export async function GET() {
    try {
        const records = await listActivityRecords();
        return NextResponse.json(records);
    } catch (error) {
        console.error(ACTIVITY_RECORDS_ERROR_MESSAGE, error);
        return apiError(ACTIVITY_RECORDS_ERROR_MESSAGE);
    }
}
