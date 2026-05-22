export type GlossaryTerm = {
    term: string;
    title: string;
    description: string;
    method: string;
};

export const SIDEBAR_GLOSSARY_TERMS: GlossaryTerm[] = [
    {
        term: 'PCF',
        title: 'Product Carbon Footprint',
        description:
            '제품 또는 활동 단위에서 발생한 탄소발자국을 kgCO₂e 기준으로 보는 지표입니다.',
        method:
            '이 서비스에서는 Excel 업로드 활동 데이터의 배출량 스냅샷(activity_records.emissions_kg)을 합산합니다. 생산량으로 나눈 제품 단위 효율값은 아닙니다.',
    },
    {
        term: '배출량',
        title: 'GHG 배출량',
        description:
            '관리 대상 회사의 온실가스 배출량을 CO₂ 환산량으로 집계한 값입니다.',
        method:
            '회사별 월간 배출 데이터(company.emissions)를 연도, 월, 회사, 배출원 기준으로 합산하며 단위는 tCO₂e입니다.',
    },
    {
        term: 'Scope',
        title: 'GHG Protocol Scope',
        description:
            '온실가스 배출을 직접 배출, 구매 에너지, 가치사슬 배출로 나누는 국제 기준입니다.',
        method:
            '배출원 코드와 Scope 매핑을 사용합니다. 경유·휘발유·천연가스는 Scope 1, 전기·열·증기는 Scope 2, 해운·출장·폐기물·플라스틱은 Scope 3으로 분류합니다.',
    },
    {
        term: '배출원',
        title: 'Source',
        description:
            '배출이 발생한 연료, 에너지, 운송, 폐기물, 원소재 활동 유형입니다.',
        method:
            '배출원별 연간 합계를 기준으로 랭킹과 드릴다운을 만들고, 같은 배출원 코드는 동일 Scope와 색상 체계로 표시합니다.',
    },
    {
        term: 'tCO₂e',
        title: '톤 이산화탄소 환산량',
        description:
            '서로 다른 온실가스를 CO₂ 기준 영향도로 환산한 배출량 단위입니다.',
        method:
            'GHG 집계 차트와 리스크 산정은 tCO₂e를 사용합니다. PCF 활동 데이터는 kgCO₂e로 저장·표시하며, 1 tCO₂e는 1,000 kgCO₂e입니다.',
    },
    {
        term: '탄소세',
        title: '탄소세 노출 시나리오',
        description:
            '실제 세무 산정이 아니라 배출량 규모에 따른 비용 노출을 가늠하는 내부 판단 지표입니다.',
        method:
            '선택 연도 연간 GHG 배출량(tCO₂e)에 가정 세율 50,000원/tCO₂e를 곱해 예상 노출액과 감축 절감액을 계산합니다.',
    },
];
