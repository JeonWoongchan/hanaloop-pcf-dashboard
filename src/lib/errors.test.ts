import { describe, expect, it } from 'vitest';
import { getErrorMessage } from './errors';

describe('getErrorMessage', () => {
    it('Error 메시지가 있으면 해당 메시지를 반환한다', () => {
        expect(getErrorMessage(new Error('서버 오류'), '기본 오류')).toBe('서버 오류');
    });

    it('Error가 아니거나 메시지가 비어 있으면 fallback을 반환한다', () => {
        expect(getErrorMessage('서버 오류', '기본 오류')).toBe('기본 오류');
        expect(getErrorMessage(new Error(''), '기본 오류')).toBe('기본 오류');
    });
});
