import { apiError } from '@/lib/server/api-response';
import { listActivityRecordsByCompany } from '@/lib/server/activity-records';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const ACTIVITY_RECORDS_ERROR_MESSAGE = '활동 데이터를 불러오지 못했습니다.';
const INVALID_COMPANY_ID_MESSAGE = '회사 ID가 필요합니다.';

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ companyId: string }> }
) {
    try {
        const { companyId } = await params;
        const normalizedCompanyId = companyId.trim();

        if (!normalizedCompanyId) {
            return apiError(INVALID_COMPANY_ID_MESSAGE, 400);
        }

        const records = await listActivityRecordsByCompany(normalizedCompanyId);
        return NextResponse.json(records);
    } catch (error) {
        console.error(ACTIVITY_RECORDS_ERROR_MESSAGE, error);
        return apiError(ACTIVITY_RECORDS_ERROR_MESSAGE);
    }
}
