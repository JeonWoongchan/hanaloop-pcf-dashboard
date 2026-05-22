import { sql } from '@/lib/db';
import type { ParsedActivityInputRow, ParsedActivityRow } from '@/types';

type EmissionFactorRow = {
    id: string;
    source: string;
    scope: string | number;
    factor_kg: string | number;
    version: string;
};

type ApplyEmissionFactorsResult =
    | { ok: true; rows: ParsedActivityRow[] }
    | { ok: false; error: string };

function normalizeNumber(value: string | number, fieldName: string): number {
    const normalized = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(normalized)) {
        throw new Error(`Invalid emission factor number: ${fieldName}`);
    }

    return normalized;
}

function normalizeScope(value: string | number): ParsedActivityRow['scope'] {
    const normalized = normalizeNumber(value, 'scope');
    if (normalized === 1 || normalized === 2 || normalized === 3) {
        return normalized;
    }

    throw new Error(`Invalid emission factor scope: ${value}`);
}

async function findEmissionFactor(row: ParsedActivityInputRow): Promise<EmissionFactorRow | null> {
    const rows = await sql<EmissionFactorRow[]>`
        SELECT id, source, scope, factor_kg, version
        FROM emission_factors
        WHERE activity_type = ${row.activityType}
          AND description = ${row.description}
          AND unit = ${row.unit}
          AND valid_from <= ${row.originalDate}::date
          AND (valid_to IS NULL OR valid_to >= ${row.originalDate}::date)
        ORDER BY valid_from DESC, created_at DESC
        LIMIT 1
    `;

    return rows[0] ?? null;
}

function factorCacheKey(row: ParsedActivityInputRow): string {
    return [row.originalDate, row.activityType, row.description, row.unit].join('\u0000');
}

export async function applyEmissionFactors(
    rows: ParsedActivityInputRow[]
): Promise<ApplyEmissionFactorsResult> {
    const factorCache = new Map<string, EmissionFactorRow>();
    const enrichedRows: ParsedActivityRow[] = [];

    for (const row of rows) {
        const cacheKey = factorCacheKey(row);
        let factor = factorCache.get(cacheKey);

        if (!factor) {
            const foundFactor = await findEmissionFactor(row);
            if (!foundFactor) {
                return {
                    ok: false,
                    error: `DB 배출계수를 찾을 수 없습니다: "${row.activityType} - ${row.description} (${row.unit})" (${row.rowNumber}행)`,
                };
            }
            factor = foundFactor;
            factorCache.set(cacheKey, factor);
        }

        const emissionFactorKg = normalizeNumber(factor.factor_kg, 'factor_kg');
        const emissionsKg = Number((row.quantity * emissionFactorKg).toFixed(4));
        const emissions = Number((emissionsKg / 1000).toFixed(4));

        enrichedRows.push({
            ...row,
            emissionFactorId: factor.id,
            emissionFactorVersion: factor.version,
            source: factor.source,
            scope: normalizeScope(factor.scope),
            emissionFactorKg,
            emissionsKg,
            emissions,
        });
    }

    return { ok: true, rows: enrichedRows };
}
