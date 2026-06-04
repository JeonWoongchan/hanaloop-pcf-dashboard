import * as XLSX from 'xlsx';
import { SCOPE_MAP } from '@/constants/ghg-scope';
import type { ParsedGhgRow } from '@/types';

// GHG 배출량 Excel 필수 컬럼 헤더
const COL_YEAR_MONTH = '연월';
const COL_SOURCE = '배출원';
const COL_EMISSIONS = '배출량(tCO₂e)';

type RawExcelRow = Record<string, unknown>;

export type GhgExcelParseResult =
    | { ok: true; rows: ParsedGhgRow[] }
    | { ok: false; error: string };

function getString(row: RawExcelRow, key: string): string {
    const value = row[key];
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number') return String(value);
    return '';
}

function getPositiveNumber(row: RawExcelRow, key: string): number | null {
    const value = row[key];
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

// 공백 문자열(' ')도 빈 값으로 처리 — Excel에서 스페이스 입력 후 저장한 셀 포함
function isBlankRow(row: RawExcelRow): boolean {
    return Object.values(row).every(
        (v) => v === null || v === undefined || (typeof v === 'string' && v.trim() === '')
    );
}

export function parseGhgExcel(buffer: Buffer): GhgExcelParseResult {
    let workbook: XLSX.WorkBook;
    try {
        workbook = XLSX.read(buffer, { type: 'buffer' });
    } catch {
        return { ok: false, error: '유효하지 않은 Excel 파일입니다.' };
    }

    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return { ok: false, error: '시트가 없습니다.' };

    const ws = workbook.Sheets[sheetName];
    if (!ws) return { ok: false, error: '시트를 읽을 수 없습니다.' };

    // defval:'' 로 빈 셀도 빈 문자열로 포함 — 모든 행이 배열에 포함되어 rowNumber가 실제 Excel 행 번호와 일치
    const rows = XLSX.utils.sheet_to_json<RawExcelRow>(ws, { defval: '' });
    if (rows.length === 0) return { ok: false, error: '데이터가 없습니다.' };

    const validSources = new Set(Object.keys(SCOPE_MAP));
    const parsed: ParsedGhgRow[] = [];

    for (let index = 0; index < rows.length; index++) {
        const row = rows[index];
        if (!row || isBlankRow(row)) continue;

        const rowNumber = index + 2; // 헤더 포함 1-based

        const yearMonth = getString(row, COL_YEAR_MONTH);
        const source = getString(row, COL_SOURCE);
        const emissions = getPositiveNumber(row, COL_EMISSIONS);

        if (!yearMonth || !source) {
            return {
                ok: false,
                error: `필수 값(연월, 배출원)이 누락된 행입니다. (${rowNumber}행)`,
            };
        }
        if (!/^\d{4}-\d{2}$/.test(yearMonth)) {
            return {
                ok: false,
                error: `연월 형식이 올바르지 않습니다. "YYYY-MM" 형식으로 입력하세요. (${rowNumber}행: "${yearMonth}")`,
            };
        }
        if (!validSources.has(source)) {
            return {
                ok: false,
                error: `알 수 없는 배출원 코드입니다: "${source}" (${rowNumber}행). 유효한 값: ${[...validSources].join(', ')}`,
            };
        }
        if (emissions === null) {
            return {
                ok: false,
                error: `배출량은 0보다 큰 숫자여야 합니다. (${rowNumber}행)`,
            };
        }

        parsed.push({ yearMonth, source, emissions, rowNumber });
    }

    if (parsed.length === 0) return { ok: false, error: '임포트할 유효 데이터가 없습니다.' };

    return { ok: true, rows: parsed };
}
