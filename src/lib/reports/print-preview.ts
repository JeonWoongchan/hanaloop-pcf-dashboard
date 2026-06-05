import type { ReportCellValue, ReportColumn, ReportWorkbook } from './types';

const REPORT_BRAND_NAME = 'PCF Dashboard';

export function writeReportLoadingPreview(targetWindow: Window) {
    targetWindow.document.open();
    targetWindow.document.write(
        getBaseDocument(
            '보고서를 준비하고 있습니다.',
            '<div class="loading">보고서를 준비하고 있습니다...</div>'
        )
    );
    targetWindow.document.close();
}

export function writeReportPrintPreview(targetWindow: Window, workbook: ReportWorkbook) {
    if (workbook.sheets.length === 0) {
        throw new Error('미리보기할 보고서 시트가 없습니다.');
    }

    const content = [
        renderToolbar(),
        renderCover(workbook),
        ...workbook.sheets.map((sheet, index) =>
            renderSheet({
                index,
                name: sheet.name,
                columns: sheet.columns,
                rows: sheet.rows,
            })
        ),
    ].join('');

    targetWindow.document.open();
    targetWindow.document.write(getBaseDocument(`${workbook.fileName} 보고서`, content));
    targetWindow.document.close();
    targetWindow.focus();
}

function getBaseDocument(title: string, body: string) {
    return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<style>
${REPORT_STYLES}
</style>
</head>
<body>
${body}
</body>
</html>`;
}

function renderToolbar() {
    return `<div class="toolbar">
    <div>
        <strong>${REPORT_BRAND_NAME}</strong>
        <span>Printable report</span>
    </div>
    <button type="button" onclick="window.print()">PDF 저장 / 인쇄</button>
</div>`;
}

function renderCover(workbook: ReportWorkbook) {
    const summaryRows = workbook.sheets[0]?.rows.slice(0, 6) ?? [];
    const summaryCards = summaryRows
        .map((row) => {
            const item = getRowValue(row, ['item', '항목']) ?? '-';
            const value = getRowValue(row, ['value', '값']) ?? '-';
            const unit = getRowValue(row, ['unit', '단위']);

            return `<div class="summary-card">
                <dt>${escapeHtml(String(item))}</dt>
                <dd>${escapeHtml(formatValue(value, { label: String(item) }))}${unit ? `<span>${escapeHtml(String(unit))}</span>` : ''}</dd>
            </div>`;
        })
        .join('');

    return `<section class="cover">
    <div class="eyebrow">REPORT</div>
    <h1>${escapeHtml(normalizeReportTitle(workbook.fileName))}</h1>
    <p>대시보드에서 선택한 조건을 기준으로 배출 현황, 비용 리스크, 대응 데이터를 정리한 인쇄용 보고서입니다.</p>
    <dl class="summary-grid">${summaryCards}</dl>
</section>`;
}

function renderSheet({
    index,
    name,
    columns,
    rows,
}: {
    index: number;
    name: string;
    columns: ReportColumn[];
    rows: Record<string, ReportCellValue>[];
}) {
    return `<section class="sheet">
    <div class="sheet-header">
        <div class="sheet-index">${String(index + 1).padStart(2, '0')}</div>
        <div>
            <h2>${escapeHtml(name)}</h2>
            <p>${formatNumber(rows.length)}개 행 · ${formatNumber(columns.length)}개 항목</p>
        </div>
    </div>
    <div class="table-wrap">
        <table>
            <thead>
                <tr>${columns.map((column) => `<th>${escapeHtml(column.header)}</th>`).join('')}</tr>
            </thead>
            <tbody>
                ${
                    rows.length > 0
                        ? rows
                              .map(
                                  (row) =>
                                      `<tr>${columns
                                          .map(
                                              (column) =>
                                                  `<td>${escapeHtml(formatValue(row[column.key], column))}</td>`
                                          )
                                          .join('')}</tr>`
                              )
                              .join('')
                        : `<tr><td colspan="${columns.length}">보고서 데이터가 없습니다.</td></tr>`
                }
            </tbody>
        </table>
    </div>
</section>`;
}

function getRowValue(row: Record<string, ReportCellValue>, candidateKeys: string[]) {
    for (const key of candidateKeys) {
        if (row[key] !== undefined && row[key] !== null) return row[key];
    }

    return null;
}

function normalizeReportTitle(fileName: string) {
    return fileName
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase())
        .trim();
}

type ReportValueContext = Partial<Pick<ReportColumn, 'key' | 'header'>> & { label?: string };

function formatValue(value: ReportCellValue | undefined, context?: ReportValueContext) {
    if (value === null || value === undefined || value === '') return '-';
    if (typeof value === 'number' && isYearContext(context)) return String(value);
    if (typeof value === 'number') return formatNumber(value);

    return value;
}

function isYearContext(context?: ReportValueContext) {
    const key = context?.key?.toLowerCase();
    const text = [context?.header, context?.label].filter(Boolean).join(' ');

    return key === 'year' || text.includes('기준 연도');
}

function formatNumber(value: number) {
    return new Intl.NumberFormat('ko-KR', {
        maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
    }).format(value);
}

function escapeHtml(value: string) {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

const REPORT_STYLES = `
:root {
    color-scheme: light;
    --bg: #f6f7f9;
    --paper: #ffffff;
    --ink: #101827;
    --muted: #657085;
    --line: #dce2ea;
    --soft: #eef2f6;
    --green: #1f9d63;
    --navy: #09111f;
}
* {
    box-sizing: border-box;
}
html,
body {
    margin: 0;
    background: var(--bg);
    color: var(--ink);
    font-family: Pretendard, "Noto Sans KR", "Apple SD Gothic Neo", system-ui, sans-serif;
}
body {
    padding: 24px;
}
.toolbar {
    position: sticky;
    top: 16px;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: 1120px;
    margin: 0 auto 18px;
    padding: 10px 12px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(8px);
    box-shadow: 0 14px 32px rgba(15, 23, 42, 0.08);
}
.toolbar strong {
    display: block;
    font-size: 13px;
}
.toolbar span {
    color: var(--muted);
    font-size: 11px;
}
.toolbar button {
    height: 34px;
    border: 0;
    border-radius: 8px;
    background: var(--navy);
    color: #fff;
    font-weight: 700;
    padding: 0 14px;
    cursor: pointer;
}
.cover,
.sheet {
    max-width: 1120px;
    margin: 0 auto 18px;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--paper);
    box-shadow: 0 18px 44px rgba(15, 23, 42, 0.08);
}
.cover {
    padding: 34px;
    background: linear-gradient(135deg, #09111f 0%, #111827 72%, #133822 100%);
    color: #fff;
}
.eyebrow {
    margin-bottom: 20px;
    color: #90e0b4;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.14em;
}
h1 {
    max-width: 720px;
    margin: 0;
    font-size: 34px;
    line-height: 1.15;
    letter-spacing: 0;
}
.cover > p {
    max-width: 760px;
    margin: 14px 0 26px;
    color: #cbd5e1;
    font-size: 14px;
    line-height: 1.65;
}
.summary-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin: 0;
}
.summary-card {
    min-height: 92px;
    padding: 16px;
    border: 1px solid rgba(255, 255, 255, 0.16);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.08);
}
.summary-card dt {
    margin-bottom: 10px;
    color: #cbd5e1;
    font-size: 11px;
}
.summary-card dd {
    margin: 0;
    font-size: 21px;
    font-weight: 800;
    line-height: 1.25;
}
.summary-card dd span {
    margin-left: 4px;
    color: #cbd5e1;
    font-size: 11px;
    font-weight: 500;
}
.sheet {
    overflow: hidden;
}
.sheet-header {
    display: flex;
    gap: 14px;
    align-items: center;
    padding: 22px 24px;
    border-bottom: 1px solid var(--line);
}
.sheet-index {
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: #eaf8f0;
    color: #137a4b;
    font-size: 12px;
    font-weight: 800;
}
h2 {
    margin: 0;
    font-size: 19px;
}
.sheet-header p {
    margin: 4px 0 0;
    color: var(--muted);
    font-size: 12px;
}
.table-wrap {
    overflow-x: auto;
}
table {
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
}
th,
td {
    padding: 10px 12px;
    border-bottom: 1px solid #eef1f5;
    text-align: left;
    vertical-align: top;
    white-space: nowrap;
}
th {
    background: #f8fafc;
    color: #3b4354;
    font-size: 10px;
    font-weight: 800;
}
td {
    color: #1f2937;
}
tbody tr:nth-child(even) td {
    background: #fbfcfd;
}
.omitted {
    margin: 0;
    padding: 12px 24px 18px;
    color: var(--muted);
    font-size: 11px;
}
.loading {
    display: grid;
    min-height: 100vh;
    place-items: center;
    color: var(--muted);
    font-weight: 700;
}
@media print {
    body {
        padding: 0;
        background: #fff;
    }
    .toolbar {
        display: none;
    }
    .cover,
    .sheet {
        width: 100%;
        max-width: none;
        margin: 0 0 14mm;
        border-radius: 0;
        box-shadow: none;
        break-inside: avoid;
    }
    .cover {
        min-height: 170mm;
        break-after: page;
    }
    .summary-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    th,
    td {
        white-space: normal;
    }
}
`;
