import * as XLSX from 'xlsx';
import type { ParsedActivityInputRow } from '@/types';

const ACTIVITY_SHEET_NAME = '과제용 데이터';
const DATA_HEADER_LABEL = '일자';

type RawExcelRow = Record<string, unknown>;

export type ExcelParseResult =
    | { ok: true; rows: ParsedActivityInputRow[] }
    | { ok: false; error: string };

function resolveDate(raw: unknown): string | null {
    if (raw instanceof Date) {
        return raw.toISOString().slice(0, 10);
    }
    if (typeof raw === 'string') return raw.trim();
    if (typeof raw === 'number') {
        const parsed = XLSX.SSF.parse_date_code(raw);
        if (!parsed) return null;
        const year = parsed.y;
        const month = String(parsed.m).padStart(2, '0');
        const day = String(parsed.d).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    return null;
}

function findHeaderRowIndex(ws: XLSX.WorkSheet): number {
    const ref = ws['!ref'];
    if (!ref) return 0;

    const range = XLSX.utils.decode_range(ref);
    for (let row = range.s.r; row <= Math.min(range.e.r, 9); row++) {
        for (let col = range.s.c; col <= Math.min(range.e.c, 5); col++) {
            const cell = ws[XLSX.utils.encode_cell({ r: row, c: col })];
            if (cell && String(cell.v).includes(DATA_HEADER_LABEL)) return row;
        }
    }
    return range.s.r;
}

function getString(row: RawExcelRow, keys: string[]): string {
    for (const key of keys) {
        const value = row[key];
        if (typeof value === 'string') return value.trim();
        if (typeof value === 'number') return String(value);
    }
    return '';
}

function getNumber(row: RawExcelRow, keys: string[]): number | null {
    for (const key of keys) {
        const value = row[key];
        if (value === null || value === undefined || value === '') continue;
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    return null;
}

function isBlankRow(row: RawExcelRow): boolean {
    return Object.values(row).every(
        (value) => value === null || value === undefined || value === ''
    );
}

function validateDate(rawDate: string, rowNumber: number): ExcelParseResult | null {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
        return { ok: false, error: `잘못된 일자 형식입니다: "${rawDate}" (${rowNumber}행)` };
    }
    return null;
}

export function parseActivityExcel(buffer: Buffer): ExcelParseResult {
    let workbook: XLSX.WorkBook;
    try {
        workbook = XLSX.read(buffer, { type: 'buffer' });
    } catch {
        return { ok: false, error: '유효하지 않은 Excel 파일입니다.' };
    }

    const targetSheet =
        workbook.SheetNames.find((name) => name.includes(ACTIVITY_SHEET_NAME)) ??
        workbook.SheetNames[0];
    if (!targetSheet) return { ok: false, error: '시트가 없습니다.' };

    const ws = workbook.Sheets[targetSheet];
    if (!ws) return { ok: false, error: '시트를 읽을 수 없습니다.' };

    const headerRowIndex = findHeaderRowIndex(ws);
    const rows = XLSX.utils.sheet_to_json<RawExcelRow>(ws, { range: headerRowIndex });
    if (rows.length === 0) return { ok: false, error: '데이터가 없습니다.' };

    const parsed: ParsedActivityInputRow[] = [];

    for (let index = 0; index < rows.length; index++) {
        const row = rows[index];
        if (!row || isBlankRow(row)) continue;

        const rowNumber = headerRowIndex + index + 2;
        const originalDate = resolveDate(row['일자(원본)']);
        const activityType = getString(row, ['활동 유형']);
        const description = getString(row, ['설명']);
        const quantity = getNumber(row, ['량']);
        const unit = getString(row, ['단위']);

        if (!originalDate || !activityType || !description || !unit) {
            return { ok: false, error: `필수 값이 누락된 행입니다. (${rowNumber}행)` };
        }
        if (quantity === null || quantity <= 0) {
            return { ok: false, error: `량은 0보다 큰 숫자여야 합니다. (${rowNumber}행)` };
        }

        const dateError = validateDate(originalDate, rowNumber);
        if (dateError) return dateError;

        const yearMonth = originalDate.slice(0, 7);

        parsed.push({
            originalDate,
            yearMonth,
            activityType,
            description,
            quantity,
            unit,
            rowNumber,
        });
    }

    if (parsed.length === 0) return { ok: false, error: '임포트할 유효 데이터가 없습니다.' };

    return { ok: true, rows: parsed };
}
