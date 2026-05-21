import type { Post } from '@/types';

export const posts: Post[] = [
    {
        id: 'p1',
        title: '2024 Q1 지속가능성 보고서',
        resourceUid: 'c1',
        dateTime: '2024-03',
        content:
            'Q1 배출량이 전분기 대비 4.5% 감소했습니다. 디젤 차량 일부를 전기차로 교체한 효과입니다. 연말까지 추가 15% 감축을 목표로 합니다.',
    },
    {
        id: 'p2',
        title: '에너지 효율화 투자 계획 수립',
        resourceUid: 'c3',
        dateTime: '2024-06',
        content:
            '철강 생산 공정의 전력 소비를 줄이기 위한 에너지 효율화 투자 계획을 수립했습니다. 2025년까지 Scope 2 배출량 20% 감축 목표.',
    },
    {
        id: 'p3',
        title: '옥상 태양광 패널 설치 완료',
        resourceUid: 'c4',
        dateTime: '2024-05',
        content:
            '사옥 옥상에 500kW 규모의 태양광 패널 설치를 완료했습니다. 전기 구매량이 월 40% 감소했으며, 5월부터 효과가 수치로 나타나고 있습니다.',
    },
    {
        id: 'p4',
        title: 'Q3 배출량 증가 원인 분석',
        resourceUid: 'c5',
        dateTime: '2024-08',
        content:
            '아시아-북미 노선 물동량 증가로 운항 횟수가 늘어 Scope 3 배출량이 전분기 대비 8% 증가했습니다. 연료 효율 개선 방안을 검토 중입니다.',
    },
    {
        id: 'p5',
        title: '물류 경로 최적화 성과 보고',
        resourceUid: 'c2',
        dateTime: '2024-10',
        content:
            '유럽 허브 확장으로 운송량이 증가했으나, AI 기반 경로 최적화 도입으로 차량당 배출량은 전년 대비 3% 감소했습니다.',
    },
];
