-- 배출권 단가 이력 테이블 — 새 레코드 추가 방식으로 단가 변경 이력 보존
CREATE TABLE IF NOT EXISTS allowance_prices (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    price_krw    NUMERIC      NOT NULL CHECK (price_krw > 0),
    effective_from DATE        NOT NULL UNIQUE,
    note         TEXT,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- 초기 단가 — 재실행 시 effective_from 충돌로 중복 삽입 방지
INSERT INTO allowance_prices (price_krw, effective_from, note)
VALUES (24550, '2024-01-01', 'K-ETS 2024년 기준 시장 평균가 참고')
ON CONFLICT (effective_from) DO NOTHING;

INSERT INTO allowance_prices (price_krw, effective_from, note)
VALUES (24550, '2025-05-01', 'K-ETS 2025년 기준 시장 평균가 참고')
ON CONFLICT (effective_from) DO NOTHING;

INSERT INTO allowance_prices (price_krw, effective_from, note)
VALUES (24550, '2026-06-01', 'K-ETS 2026년 기준 시장 평균가 참고')
ON CONFLICT (effective_from) DO NOTHING;
