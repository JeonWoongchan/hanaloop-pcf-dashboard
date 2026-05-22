export type Country = {
    code: string;
    name: string;
};

export type GhgEmission = {
    yearMonth: string;
    source: string;
    emissions: number;
};

export type Company = {
    id: string;
    name: string;
    country: string;
    emissions: GhgEmission[];
};

export type Post = {
    id: string;
    title: string;
    resourceUid: string;
    dateTime: string;
    content: string;
    author: string;
};

export type CompanyWithTotal = Company & { total: number };

// Excel 임포트 파싱 결과 — 원본 활동 데이터 + 파생 배출량 컬럼
export type ParsedActivityRow = {
    // 원본 활동 데이터 (Excel 그대로)
    originalDate: string;       // "YYYY-MM-DD"
    yearMonth: string;          // "YYYY-MM"
    activityType: string;
    description: string;
    quantity: number;
    unit: string;
    rowNumber: number;          // 데이터 섹션 내 1-based 행 번호
    // 파생 필드 (DB 저장 시 채워지는 컬럼)
    source: string;
    scope: 1 | 2 | 3;
    emissionFactorKg: number;   // kgCO₂e / unit
    emissionsKg: number;        // quantity × emissionFactorKg
    emissions: number;          // tCO₂e (emissionsKg / 1000)
};
