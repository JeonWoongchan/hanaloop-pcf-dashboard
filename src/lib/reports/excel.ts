import type {
    ReportCellValue,
    ReportColumn,
    ReportRow,
    ReportSheet,
    ReportWorkbook,
} from './types';

const EXCEL_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const DEFAULT_FILE_NAME = 'hanaloop-report';
const MAX_SHEET_NAME_LENGTH = 31;
const MIN_COLUMN_WIDTH = 8;
const MAX_COLUMN_WIDTH = 60;

type DownloadReportWorkbookOptions = {
    fileName?: string;
    now?: Date;
};

export async function downloadReportWorkbook(
    reportWorkbook: ReportWorkbook,
    options: DownloadReportWorkbookOptions = {}
) {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        throw new Error('Excel 보고서 다운로드는 브라우저에서만 실행할 수 있습니다.');
    }

    validateWorkbook(reportWorkbook);

    const XLSX = await import('xlsx');
    const workbook = XLSX.utils.book_new();
    const usedSheetNames = new Set<string>();

    for (let index = 0; index < reportWorkbook.sheets.length; index++) {
        const sheet = reportWorkbook.sheets[index];
        const worksheet = XLSX.utils.aoa_to_sheet(createSheetRows(sheet));
        worksheet['!cols'] = sheet.columns.map((column) => ({
            wch: getColumnWidth(column, sheet.rows),
        }));

        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            createSafeSheetName(sheet.name, index, usedSheetNames)
        );
    }

    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
    const blob = new Blob([buffer], { type: EXCEL_MIME_TYPE });
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = objectUrl;
    link.download = createFileName(options.fileName ?? reportWorkbook.fileName, options.now);
    link.rel = 'noopener';
    document.body.appendChild(link);

    try {
        link.click();
    } finally {
        link.remove();
        window.URL.revokeObjectURL(objectUrl);
    }
}

function validateWorkbook(workbook: ReportWorkbook) {
    if (!workbook.sheets.length) {
        throw new Error('내보낼 보고서 시트가 없습니다.');
    }

    for (const sheet of workbook.sheets) {
        if (!sheet.name.trim()) {
            throw new Error('보고서 시트명이 비어 있습니다.');
        }
        if (!sheet.columns.length) {
            throw new Error(`${sheet.name} 시트에 내보낼 컬럼이 없습니다.`);
        }
    }
}

function createSheetRows(sheet: ReportSheet): ReportCellValue[][] {
    return [
        sheet.columns.map((column) => column.header),
        ...sheet.rows.map((row) => sheet.columns.map((column) => normalizeCell(row, column))),
    ];
}

function normalizeCell(row: ReportRow, column: ReportColumn): ReportCellValue {
    const value = row[column.key];

    if (value === undefined || value === null) return null;
    if (typeof value === 'string') return value;
    if (typeof value === 'number' && Number.isFinite(value)) return value;

    throw new Error(`${column.header} 컬럼에 Excel로 내보낼 수 없는 값이 있습니다.`);
}

function getColumnWidth(column: ReportColumn, rows: ReportRow[]) {
    if (typeof column.width === 'number' && Number.isFinite(column.width) && column.width > 0) {
        return clampWidth(column.width);
    }

    const contentWidth = Math.max(
        getDisplayLength(column.header),
        ...rows.map((row) => getDisplayLength(row[column.key]))
    );
    return clampWidth(contentWidth + 2);
}

function clampWidth(width: number) {
    return Math.min(Math.max(Math.ceil(width), MIN_COLUMN_WIDTH), MAX_COLUMN_WIDTH);
}

function getDisplayLength(value: ReportCellValue | undefined) {
    if (value === null || value === undefined) return 0;

    return [...String(value)].reduce((length, character) => {
        return length + (character.charCodeAt(0) > 127 ? 2 : 1);
    }, 0);
}

function createSafeSheetName(name: string, index: number, usedSheetNames: Set<string>) {
    const fallbackName = `Sheet${index + 1}`;
    const baseName = sanitizeSheetName(name) || fallbackName;
    let candidate = baseName.slice(0, MAX_SHEET_NAME_LENGTH);
    let suffix = 2;

    while (usedSheetNames.has(candidate)) {
        const suffixText = `_${suffix}`;
        candidate = `${baseName.slice(0, MAX_SHEET_NAME_LENGTH - suffixText.length)}${suffixText}`;
        suffix += 1;
    }

    usedSheetNames.add(candidate);
    return candidate;
}

function sanitizeSheetName(name: string) {
    return name
        .replace(/[:\\/?*\[\]]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function createFileName(fileName: string, now = new Date()) {
    const normalizedName = sanitizeFileName(fileName.replace(/\.xlsx$/i, '')) || DEFAULT_FILE_NAME;
    return `${normalizedName}_${formatTimestamp(now)}.xlsx`;
}

function sanitizeFileName(fileName: string) {
    return fileName
        .replace(/[<>:"/\\|?*]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function formatTimestamp(date: Date) {
    const year = date.getFullYear();
    const month = pad2(date.getMonth() + 1);
    const day = pad2(date.getDate());
    const hours = pad2(date.getHours());
    const minutes = pad2(date.getMinutes());

    return `${year}${month}${day}_${hours}${minutes}`;
}

function pad2(value: number) {
    return String(value).padStart(2, '0');
}
