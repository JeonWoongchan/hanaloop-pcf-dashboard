import * as XLSX from 'xlsx';
import { SCOPE_MAP } from '@/constants/ghg-scope';
import type { ParsedActivityRow } from '@/types';

// 배출계수 (kgCO₂e per unit) — 과제 스펙 Excel "배출계수" 시트 기준
const EMISSION_FACTORS: Record<string, { source: string; factorKg: number }> = {
    '전기:한국전력': { source: 'electricity', factorKg: 0.456 },
    '원소재:플라스틱 1': { source: 'plastic1', factorKg: 2.3 },
    '원소재:플라스틱 2': { source: 'plastic2', factorKg: 3.2 },
    '운송:트럭': { source: 'shipping', factorKg: 3.5 },
};

type RawExcelRow = Record<string, unknown>;

export type ExcelParseResult =
    | { ok: true; rows: ParsedActivityRow[] }
    | { ok: false; error: string };

function resolveDate(raw: unknown): string | null {
    if (raw instanceof Date) {
        // cellDates: true 옵션으로 파싱된 Date 객체 처리
        return raw.toISOString().slice(0, 10);
    }
    if (typeof raw === 'string') return raw.trim();
    if (typeof raw === 'number') {
        // Excel 날짜 시리얼 값 처리
        const parsed = XLSX.SSF.parse_date_code(raw);
        if (!parsed) return null;
        const y = parsed.y;
        const m = String(parsed.m).padStart(2, '0');
        const d = String(parsed.d).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
    return null;
}

// 시트에서 '일자(원본)' 헤더가 있는 행 번호를 자동 탐색
// A열이 비어있는 레이아웃(B열 시작)도 대응하기 위해 모든 열을 스캔
function findHeaderRowIndex(ws: XLSX.WorkSheet): number {
    const ref = ws['!ref'];
    if (!ref) return 0;
    const range = XLSX.utils.decode_range(ref);
    for (let r = range.s.r; r <= Math.min(range.e.r, 9); r++) {
        for (let c = range.s.c; c <= Math.min(range.e.c, 5); c++) {
            const cell = ws[XLSX.utils.encode_cell({ r, c })];
            if (cell && String(cell.v).includes('일자')) return r;
        }
    }
    return range.s.r;
}

export function parseActivityExcel(buffer: Buffer): ExcelParseResult {
    let workbook: XLSX.WorkBook;
    try {
        // cellDates: true 를 쓰면 날짜 서식이 적용된 숫자 셀(량 등)도 Date로 변환돼 오동작 — 제거
        workbook = XLSX.read(buffer, { type: 'buffer' });
    } catch {
        return { ok: false, error: '유효하지 않은 Excel 파일입니다.' };
    }

    // '과제용 데이터' 시트를 우선 탐색, 없으면 첫 번째 시트 사용
    const targetSheet =
        workbook.SheetNames.find((n) => n.includes('과제용 데이터')) ??
        workbook.SheetNames[0];
    if (!targetSheet) return { ok: false, error: '시트가 없습니다.' };

    const ws = workbook.Sheets[targetSheet]!;

    // 헤더 행 위치를 동적으로 찾아 제목·설명 행 자동 스킵
    const headerRowIndex = findHeaderRowIndex(ws);
    const rows = XLSX.utils.sheet_to_json<RawExcelRow>(ws, { range: headerRowIndex });
    if (rows.length === 0) return { ok: false, error: '데이터가 없습니다.' };

    const parsed: ParsedActivityRow[] = [];

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i]!;

        const originalDate = resolveDate(row['일자(원본)']);
        const activityType = String(row['활동 유형'] ?? '').trim();
        const description = String(row['설명'] ?? '').trim();
        const quantity = Number(row['량']);
        const unit = String(row['단위'] ?? '').trim();

        // 필수 필드 누락 행 스킵
        // quantity <= 0 포함 — 빈 셀("")이 Number("")===0으로 통과하는 케이스 방지
        if (!originalDate || !activityType || !description || !unit || isNaN(quantity) || quantity <= 0) {
            continue;
        }

        const factorKey = `${activityType}:${description}`;
        const mapping = EMISSION_FACTORS[factorKey];
        if (!mapping) {
            return {
                ok: false,
                error: `알 수 없는 활동 유형: "${activityType} - ${description}" (${i + 2}행)`,
            };
        }

        // yearMonth 변환 (YYYY-MM-DD → YYYY-MM)
        if (originalDate.length < 7) {
            return { ok: false, error: `잘못된 날짜 형식: "${originalDate}" (${i + 2}행)` };
        }
        const yearMonth = originalDate.slice(0, 7);

        const { source, factorKg } = mapping;
        const scope = (SCOPE_MAP[source] ?? 3) as 1 | 2 | 3;
        const emissionsKg = Number((quantity * factorKg).toFixed(4));
        const emissions = Number((emissionsKg / 1000).toFixed(4));

        parsed.push({
            originalDate,
            yearMonth,
            activityType,
            description,
            quantity,
            unit,
            rowNumber: i + 1,
            source,
            scope,
            emissionFactorKg: factorKg,
            emissionsKg,
            emissions,
        });
    }

    if (parsed.length === 0) return { ok: false, error: '임포트할 유효 데이터가 없습니다.' };

    return { ok: true, rows: parsed };
}
