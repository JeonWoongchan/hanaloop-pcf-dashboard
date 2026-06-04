export type ReportCellValue = string | number | null;

export type ReportRow = Record<string, ReportCellValue>;

export type ReportColumn = {
    key: string;
    header: string;
    width?: number;
};

export type ReportSheet = {
    name: string;
    columns: ReportColumn[];
    rows: ReportRow[];
};

export type ReportWorkbook = {
    fileName: string;
    sheets: ReportSheet[];
};
