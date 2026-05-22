import * as XLSX from 'xlsx';
import { describe, expect, it } from 'vitest';
import { parseActivityExcel } from './excel-import';

function workbookToBuffer(workbook: XLSX.WorkBook): Buffer {
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

describe('parseActivityExcel', () => {
    it('헤더가 첫 행이 아니어도 실제 Excel 행 번호를 보존한다', () => {
        const workbook = XLSX.utils.book_new();
        const sheet = XLSX.utils.aoa_to_sheet([
            ['업로드 안내'],
            ['일자(원본)', '활동 유형', '설명', '량', '단위'],
            ['2024-01-15', '전기', '한국전력', 100, 'kWh'],
        ]);

        XLSX.utils.book_append_sheet(workbook, sheet, '과제용 데이터');

        const result = parseActivityExcel(workbookToBuffer(workbook));

        expect(result.ok).toBe(true);
        if (!result.ok) return;
        expect(result.rows[0]).toMatchObject({
            rowNumber: 3,
            activityType: '전기',
            description: '한국전력',
            quantity: 100,
            unit: 'kWh',
        });
    });

    it('배출계수 시트가 있어도 파서는 원본 활동 데이터만 읽는다', () => {
        const workbook = XLSX.utils.book_new();
        const activitySheet = XLSX.utils.aoa_to_sheet([
            ['일자(원본)', '활동 유형', '설명', '량', '단위'],
            ['2024-02-01', '전기', '한국전력', 10, 'kWh'],
        ]);
        const factorSheet = XLSX.utils.aoa_to_sheet([
            ['활동 유형', '설명', '단위', 'source', '배출계수'],
            ['전기', '한국전력', 'kWh', 'electricity', 1.25],
        ]);

        XLSX.utils.book_append_sheet(workbook, activitySheet, '과제용 데이터');
        XLSX.utils.book_append_sheet(workbook, factorSheet, '배출계수');

        const result = parseActivityExcel(workbookToBuffer(workbook));

        expect(result.ok).toBe(true);
        if (!result.ok) return;
        expect(result.rows[0]).toMatchObject({
            originalDate: '2024-02-01',
            activityType: '전기',
            description: '한국전력',
            quantity: 10,
            unit: 'kWh',
        });
        expect(result.rows[0]).not.toHaveProperty('emissionFactorKg');
        expect(result.rows[0]).not.toHaveProperty('emissions');
    });

    it('파싱 오류 메시지에 실제 Excel 행 번호를 표시한다', () => {
        const workbook = XLSX.utils.book_new();
        const sheet = XLSX.utils.aoa_to_sheet([
            ['업로드 안내'],
            ['일자(원본)', '활동 유형', '설명', '량', '단위'],
            ['2024-03-10', '전기', '한국전력', 0, 'kWh'],
        ]);

        XLSX.utils.book_append_sheet(workbook, sheet, '과제용 데이터');

        const result = parseActivityExcel(workbookToBuffer(workbook));

        expect(result.ok).toBe(false);
        if (result.ok) return;
        expect(result.error).toContain('(3행)');
    });
});
