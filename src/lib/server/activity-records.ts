import { sql } from '@/lib/db';
import type { ActivityRecord } from '@/types';

export type ActivityRecordRow = {
    id: string;
    company_id: string;
    emission_factor_id: string | null;
    activity_date: Date | string;
    year_month: string;
    activity_type: string;
    description: string;
    quantity: string | number;
    unit: string;
    source: string;
    scope: string | number;
    emission_factor_kg: string | number;
    emissions_kg: string | number;
    emissions_tco2e: string | number;
    import_file_name: string | null;
    import_row_number: string | number | null;
    created_at: Date | string;
};

function normalizeDate(value: Date | string): string {
    if (value instanceof Date) {
        return value.toISOString().slice(0, 10);
    }

    return value.slice(0, 10);
}

function normalizeDateTime(value: Date | string): string {
    if (value instanceof Date) {
        return value.toISOString();
    }

    return value;
}

function normalizeNumber(value: string | number, fieldName: string): number {
    const normalized = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(normalized)) {
        throw new Error(`Invalid activity record number: ${fieldName}`);
    }

    return normalized;
}

function normalizeScope(value: string | number): ActivityRecord['scope'] {
    const normalized = normalizeNumber(value, 'scope');
    if (normalized === 1 || normalized === 2 || normalized === 3) {
        return normalized;
    }

    throw new Error(`Invalid activity record scope: ${value}`);
}

function normalizeOptionalInteger(value: string | number | null, fieldName: string): number | null {
    if (value === null) {
        return null;
    }

    const normalized = normalizeNumber(value, fieldName);
    if (!Number.isInteger(normalized)) {
        throw new Error(`Invalid activity record integer: ${fieldName}`);
    }

    return normalized;
}

export function rowToActivityRecord(row: ActivityRecordRow): ActivityRecord {
    return {
        id: row.id,
        companyId: row.company_id,
        emissionFactorId: row.emission_factor_id,
        activityDate: normalizeDate(row.activity_date),
        yearMonth: row.year_month,
        activityType: row.activity_type,
        description: row.description,
        quantity: normalizeNumber(row.quantity, 'quantity'),
        unit: row.unit,
        source: row.source,
        scope: normalizeScope(row.scope),
        emissionFactorKg: normalizeNumber(row.emission_factor_kg, 'emission_factor_kg'),
        emissionsKg: normalizeNumber(row.emissions_kg, 'emissions_kg'),
        emissionsTco2e: normalizeNumber(row.emissions_tco2e, 'emissions_tco2e'),
        importFileName: row.import_file_name,
        importRowNumber: normalizeOptionalInteger(row.import_row_number, 'import_row_number'),
        createdAt: normalizeDateTime(row.created_at),
    };
}

function rowsToActivityRecords(rows: ActivityRecordRow[]): ActivityRecord[] {
    return rows.map(rowToActivityRecord);
}

export async function listActivityRecords(): Promise<ActivityRecord[]> {
    const rows = await sql<ActivityRecordRow[]>`
        SELECT
            id, company_id, emission_factor_id,
            activity_date, year_month,
            activity_type, description, quantity, unit,
            source, scope,
            emission_factor_kg, emissions_kg, emissions_tco2e,
            import_file_name, import_row_number,
            created_at
        FROM activity_records
        ORDER BY company_id ASC, activity_date ASC, activity_type ASC, import_row_number ASC
    `;

    return rowsToActivityRecords(rows);
}

export async function listActivityRecordsByCompany(companyId: string): Promise<ActivityRecord[]> {
    const rows = await sql<ActivityRecordRow[]>`
        SELECT
            id, company_id, emission_factor_id,
            activity_date, year_month,
            activity_type, description, quantity, unit,
            source, scope,
            emission_factor_kg, emissions_kg, emissions_tco2e,
            import_file_name, import_row_number,
            created_at
        FROM activity_records
        WHERE company_id = ${companyId}
        ORDER BY activity_date ASC, activity_type ASC, import_row_number ASC
    `;

    return rowsToActivityRecords(rows);
}
