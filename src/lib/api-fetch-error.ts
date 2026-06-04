// 서버 응답에서 { error: string } 형식의 에러 메시지를 추출하는 클라이언트 유틸리티

export async function readApiError(response: Response, fallback: string): Promise<string> {
    const isJson = response.headers.get('content-type')?.includes('application/json');
    if (!isJson) return fallback;
    const body = await response.json().catch((): unknown => null);
    if (typeof body === 'object' && body !== null && 'error' in body) {
        const msg = String(body.error);
        return msg.trim() ? msg : fallback;
    }
    return fallback;
}
