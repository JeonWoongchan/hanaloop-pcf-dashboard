// 리스크 산정에 사용하는 가정값과 기준값

// 배출권 단가 DB 미로드 시 사용하는 폴백 기본값 — K-ETS 2024년 기준 시장 평균가
export const ALLOWANCE_PRICE_KRW_PER_TCO2E = 24550;

// 리스크 점수 100점 환산을 위한 항목별 최대 가중치
export const RISK_SCORE_WEIGHTS = {
    // 관리 대상 최대 배출 회사 대비 상대 배출량 점수
    emissions: 45,
    // 최근 3개월 평균 증가율 기반 추세 점수
    trend: 35,
    // Scope 1/2/3 구성에 따른 관리 난이도 점수
    scope: 20,
} as const;

// 리스크 등급 판정을 위한 점수 기준
export const RISK_LEVEL_THRESHOLDS = {
    // 즉시 검토가 필요한 고위험 기준
    high: 70,
    // 정기 모니터링과 개선 검토가 필요한 중위험 기준
    medium: 40,
} as const;

// 리스크 등급 UI 표시 라벨
export const RISK_LEVEL_LABELS = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
} as const;

// 최근 추세 산정에 사용할 비교 기간 길이
export const RECENT_TREND_MONTH_COUNT = 3;
// 추세 점수 과대 산정을 막는 증가율 상한
export const TREND_SCORE_CAP_PCT = 30;
// Scope 집중 리스크를 강하게 반영하는 비중 기준
export const HIGH_SCOPE_SHARE_PCT = 45;
// 주요 Scope 사유 문구를 표시하는 최소 비중 기준
export const MEDIUM_SCOPE_SHARE_PCT = 35;

// 리스크 등급별 시각 색상 — high=빨강, medium=노랑, low=파랑으로 통일
// 뱃지(RISK_LEVEL_CLASS_NAMES)와 프로그레스 바(RISK_BAR_COLORS)가 같은 색상 사용
export const RISK_LEVEL_CLASS_NAMES: Record<'high' | 'medium' | 'low', string> = {
    high: 'bg-destructive/10 text-destructive border-destructive/20',
    medium: 'bg-[var(--chart-3)]/10 text-[var(--chart-3)] border-[var(--chart-3)]/20',
    low: 'bg-[var(--chart-2)]/10 text-[var(--chart-2)] border-[var(--chart-2)]/20',
};

export const RISK_BAR_COLORS: Record<'high' | 'medium' | 'low', string> = {
    high: 'var(--destructive)',
    medium: 'var(--chart-3)',
    low: 'var(--chart-2)',
};

// Scope 구성 점수 배율 — 감축 난이도 기준 (Scope 3 > 2 > 1)
export const SCOPE3_SCORE_MULTIPLIER = 1.0;
export const SCOPE2_SCORE_MULTIPLIER = 0.75;
export const SCOPE1_SCORE_MULTIPLIER = 0.65;

// 배출량 규모 점수 — 상위권 기준 배율
export const HIGH_EMISSION_SCORE_RATIO = 0.75;
