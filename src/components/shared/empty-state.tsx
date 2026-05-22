// 조건에 맞는 데이터가 없을 때 공통 빈 상태 안내

type Props = {
    message?: string;
};

// 빈 상태 안내 메시지 렌더링
export function EmptyState({ message = '데이터가 없습니다.' }: Props) {
    return <div className="text-muted-foreground py-16 text-center">{message}</div>;
}
