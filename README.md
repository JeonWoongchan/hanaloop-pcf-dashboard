# PCF DASHBOARD

> HanaLoop 프론트엔드 과제용 GHG Emissions / PCF 대시보드입니다.
> 여러 관리 대상 회사의 온실가스 배출량을 Scope 1/2/3 기준으로 비교하고, Excel 활동 데이터를 업로드해 PCF 산정 배출량을 계산·시각화합니다.
> PCF는 정식 인증용 LCA 전체 범위가 아니라, 과제에서 제공한 활동 데이터와 배출계수를 기반으로 한 활동 데이터 기준 총량으로 해석했습니다.

---

## 실행 방법

`.env.example`에는 로컬 실행용 예시 값이 들어 있습니다.
해당 파일을 복사하여 `.env` 파일을 생성 한 후에 `POSTGRES_USER`, `POSTGRES_PASSWORD`를 직접 변경해 사용하세요.

```bash
# macOS/Linux
cp .env.example .env

# Windows PowerShell
copy .env.example .env
```

### 방법 1. Docker만 사용

- Docker Desktop
- 3000번, 5432번 포트 미사용

```bash
docker compose up --build
```

실행 후 브라우저에서 `http://localhost:3000`으로 접속합니다.

### 방법 2. pnpm 사용

로컬에 pnpm이 설치되어 있다면 `package.json`의 편의 스크립트를 사용할 수 있습니다.

```bash
pnpm docker:up
```

개발 서버만 실행하려면 다음 명령을 사용합니다. 
이 경우 별도 PostgreSQL 연결이 되지 않아 데이터가 표출되지 않으므로 Docker 실행을 권장합니다.

```bash
pnpm install
pnpm dev
```

### 관련 pnpm 명령

```bash
pnpm docker:build
pnpm docker:up
pnpm docker:up:detached
pnpm docker:down
pnpm build
pnpm test:run
```

---

## 기술 스택

| 영역 | 기술                               | 선택 이유 |
| --- |----------------------------------| --- |
| Framework | Next.js 15 App Router, React 19  | Route Handler와 페이지 라우팅을 한 프로젝트 안에서 구성하기 위해 |
| Language | TypeScript strict                | 배출량, Scope, PCF 계산처럼 데이터 형태가 중요한 영역의 오류를 줄이기 위해 |
| UI | Tailwind CSS v4, shadcn/ui       | 접근성 기본값과 일관된 디자인 토큰을 활용하기 위해 |
| Chart | Recharts                         | 대시보드 차트 구현 속도와 커스터마이징 균형을 맞추기 위해 |
| Server State | TanStack Query v5                | 서버 데이터 캐싱, 낙관적 업데이트, 실패 롤백을 명확히 분리하기 위해 |
| URL State | nuqs                             | 연도·국가·배출원 필터를 URL에 보존해 새로고침과 링크 공유를 지원하기 위해 |
| Validation | Zod v4                           | Excel import, API 입력값, 폼 입력값을 명시적으로 검증하기 위해 |
| Database | PostgreSQL, postgres npm package | 회사·월별 배출량·Action Notes·Excel 활동 데이터·배출계수 버전 이력을 관계형 테이블로 분리하고, 트랜잭션으로 import 재삽입을 처리하기 위해 |
| Infra | Docker, Docker Compose           | 평가자가 별도 DB 설치 없이 동일한 실행 환경을 만들 수 있게 하기 위해 |
| Test | Vitest                           | 배출량 집계, 리스크 산정, 포맷, Excel 파싱 같은 순수 함수를 빠르게 검증하기 위해 |

---

## 아키텍처

```txt
Local Postgres
    ↓
Next.js Route Handlers (/api/**)
    ↓
src/lib/api.ts
    ↓
TanStack Query hooks
    ↓
Content components
    ↓
Charts / Cards / Tables
```

페이지 컴포넌트는 Server Component로 두고, 데이터 패칭과 상호작용이 필요한 `*Content` 컴포넌트에서 client boundary를 시작했습니다. 차트 컴포넌트는 Recharts 번들 비용이 크기 때문에 `next/dynamic`과 `ssr: false`로 지연 로드했습니다.

상태는 세 계층으로 나눴습니다.

| 상태 | 관리 방식 | 예시 |
| --- | --- | --- |
| 서버 데이터 | TanStack Query | 회사, 국가, Action Notes, 활동 데이터 |
| URL 필터 | nuqs | 연도, 국가, 배출원 |
| 로컬 UI 상태 | React state | 탭, 다이얼로그, 슬라이더, 편집 상태 |

---

## 데이터 모델

핵심 테이블은 다음과 같습니다.

![Database ERD](./docs/images/erd.png)

| 테이블 | 역할 |
| --- | --- |
| `countries` | 국가 코드와 국가명 |
| `companies` | 관리 대상 회사 |
| `ghg_emissions` | 회사 단위 월별/source별 GHG 배출량 결과 |
| `posts` | 회사별 Action Notes |
| `emission_factors` | 활동 유형·설명·단위별 배출계수와 버전 이력 |
| `activity_records` | Excel 원본 활동 데이터, 사용한 계수, 계산 결과 스냅샷 |

PCF 계산 흐름은 다음과 같습니다.

```txt
Excel 업로드
→ 일자, 활동 유형, 설명, 수량, 단위 파싱
→ emission_factors에서 활동일 기준 유효 계수 조회
→ 활동량 × 배출계수 계산
→ activity_records에 원본값, 계수 참조, 계수 스냅샷, 계산 결과 저장
```

PCF 산정 공식은 다음과 같습니다.

```txt
활동별 배출량(kgCO₂e) = 활동량 × 배출계수(kgCO₂e/unit)
활동별 배출량(tCO₂e) = 활동별 배출량(kgCO₂e) ÷ 1000
총 PCF 산정 배출량 = Σ 활동별 배출량
```

과제 데이터에는 생산수량 또는 기능 단위가 없으므로, 이 프로젝트의 PCF는 제품 1개당 배출량이 아니라 활동 데이터 기준 총량으로 표시합니다.

---

## 주요 기능과 화면
* 시연 영상은 과제 제출 메일의 압축파일로 첨부하였습니다.

### Dashboard

**보여주는 것**
- 전체 관리 대상 회사의 총 GHG 배출량, Scope 1/2/3 구성, 월별 추이, 연도별 비교
- 경영자가 빠르게 볼 수 있는 KPI와 리스크 요약

**기능 설명**
Dashboard는 여러 회사의 배출 현황을 한눈에 보는 첫 화면입니다. 단순 총량뿐 아니라 Scope 구성과 월별 흐름을 함께 보여줘, 배출이 어느 영역에서 커지고 있는지 빠르게 파악할 수 있게 했습니다.

**스크린샷**

![Dashboard overview](./docs/images/dashboard1.png)

![Dashboard charts](./docs/images/dashboard2.png)

### Companies

**보여주는 것**
- 관리 대상 회사 카드 목록
- 국가, 연도, 정렬 필터
- 회사별 Scope 구성과 리스크 뱃지
- Excel 임포트 진입 버튼

**기능 설명**
Companies 페이지는 분석 대상 회사를 탐색하는 화면입니다. 과제용 Excel 활동 데이터는 이 화면에서 업로드할 수 있으며, 기존 회사를 선택하거나 새 회사를 생성해 import할 수 있습니다. 업로드된 활동 데이터는 DB의 배출계수 버전을 기준으로 계산된 뒤 `activity_records`에 저장됩니다.

**스크린샷**

![Companies](./docs/images/companies.png)

![Excel import on Companies](./docs/images/companies_excel.png)

### Company Detail

**보여주는 것**
- 특정 회사의 Scope별 배출 구성
- 월별 배출 추이와 PCF 활동 데이터
- Scope 1/2/3 감축 시나리오
- Action Notes 플로팅 패널

**기능 설명**
Company Detail은 실무자가 원인을 분석하고 후속 조치를 기록하는 화면입니다. 기존 GHG 배출량과 Excel 기반 PCF 활동 데이터를 분리해 보여주고, Scope별 감축률을 조정해 예상 배출량과 비용 변화를 확인할 수 있습니다. Action Notes는 회사별 대응 기록으로 사용하며, 저장 실패 시 낙관적 업데이트를 롤백합니다.

**스크린샷**

![Company Detail](./docs/images/company_detail.png)

![Company Detail PCF activity data](./docs/images/company_detail_excel.png)

### Risk

**보여주는 것**
- 회사별 리스크 점수와 High/Medium/Low 등급
- 예상 탄소세 노출액
- 최근 배출 증가/감소 추세
- 관리 우선순위 테이블

**기능 설명**
Risk 페이지는 배출량을 비용 리스크로 변환합니다. 리스크 점수는 연간 배출량, 최근 3개월 증가 추세, Scope 구성을 합산해 계산합니다. 탄소세율은 실제 법정 세율이 아니라 `50,000원 / tCO₂e` 가정 시나리오로 두고, 경영자가 어느 회사를 먼저 관리해야 하는지 판단할 수 있게 했습니다.

**스크린샷**

![Risk](./docs/images/risk.png)

### Sources

**보여주는 것**
- 배출원별 랭킹
- Scope별 도넛 차트
- 선택 배출원의 회사별 드릴다운
- 배출 규모와 집중도 산포도

**기능 설명**
Sources 페이지는 실무자가 “어떤 배출원에서 줄일 여지가 큰가”를 보기 위한 분석 화면입니다. 배출원을 Scope 색상 체계로 묶고, 선택한 배출원이 어떤 회사에서 크게 발생하는지 드릴다운할 수 있게 했습니다.

**스크린샷**

![Sources ranking](./docs/images/sources1.png)

![Sources drilldown](./docs/images/sources2.png)

---

## 과제 요구사항 대응

| 요구사항 | 대응 |
| --- | --- |
| PCF 계산 결과 시각화 | Excel 활동 데이터를 `activity_records`에 저장하고 Dashboard/Company Detail에서 PCF 산정 결과와 활동 데이터를 시각화 |
| 데이터 값 정확성·단위 표시 | `kgCO₂e`, `tCO₂e`, Scope 1/2/3 단위를 구분하고, `활동량 × 배출계수 ÷ 1000` 계산식을 README와 코드에 반영 |
| 입력 오류 시 에러 메시지 | Excel import 파싱 실패, 회사 미선택, 배출계수 미매칭, 저장 실패를 API 에러와 toast/error state로 표시 |
| README 로컬 실행 5단계 이내 | Docker 기준 `cp .env.example .env` → `docker compose up --build` → 브라우저 접속으로 실행 가능 |
| README AI 사용 내역 | `AI 사용 내역` 섹션에 AI가 보조한 부분과 개발자가 직접 결정한 부분을 분리해 기록 |
| README 시스템 설명·설계 | `아키텍처`, `데이터 모델`, `트레이드오프` 섹션으로 구조와 설계 근거 설명 |
| ERD/스키마 다이어그램 | README 데이터 모델 섹션에 DB 구조 정리 |
| Docker Compose 실행 | `docker-compose.yml`로 app과 PostgreSQL을 함께 실행 |
| Excel import | Companies 페이지에서 Excel 업로드, 미리보기, 저장 흐름 제공 |
| 시연 자료 | README에는 페이지별 스크린샷을 포함하고, 페이지별 시연 영상은 제출 압축 파일에 별도 포함 |

---

## 트레이드오프

### Fake endpoint 대신 PostgreSQL 사용

처음에는 과제 기본 요구사항을 빠르게 만족시키기 위해 in-memory fake endpoint로 시작했습니다. 그러나 새로고침 시 데이터가 초기화되고, 회사·배출량·Action Notes·Excel import 결과의 진실의 원천이 나뉘는 문제가 있었습니다.

최종적으로는 로컬 Docker Postgres를 기본 실행 환경으로 두고, Next.js Route Handler가 DB를 조회하도록 전환했습니다. 평가자가 앱을 실제 서비스처럼 조작해도 데이터가 유지되고, Excel import 결과와 Action Notes가 같은 저장소에 남는 점을 우선했습니다.

트레이드오프는 실행 환경이 조금 무거워진다는 점입니다. 이를 줄이기 위해 `docker-compose.yml`에서 app과 postgres를 함께 띄우고, pnpm이 없어도 `docker compose up --build` 하나로 빌드와 실행이 끝나도록 구성했습니다.

### 전역 상태 라이브러리 미도입

서버 데이터는 TanStack Query, 필터 상태는 nuqs URL 파라미터, 컴포넌트 내부 UI 상태는 React state로 나눴습니다. 페이지 간 공유해야 하는 클라이언트 전역 상태가 크지 않아 Zustand나 Redux를 추가하지 않았습니다.

이 선택은 의존성을 줄이고 데이터 흐름을 단순하게 만듭니다. 대신 복잡한 실시간 협업이나 여러 페이지에 걸친 편집 상태가 필요해지면 별도 전역 store 도입을 다시 검토해야 합니다.

### Recharts 동적 임포트로 초기 번들 최적화

차트 컴포넌트는 `next/dynamic`으로 지연 로드하고 `ssr: false`를 적용했습니다. Recharts가 초기 번들에 포함되면서 주요 페이지의 First Load JS가 커졌고, 차트는 화면의 핵심 요소지만 텍스트·KPI보다 먼저 로드될 필요는 없다고 판단했습니다.

| 페이지 | 최적화 전 | 최적화 후 | 감소량 |
| --- | --- | --- | --- |
| `/` | 320 kB | 179 kB | -141 kB (-44%) |
| `/companies/[id]` | 315 kB | 198 kB | -117 kB (-37%) |
| `/sources` | 302 kB | 167 kB | -135 kB (-45%) |

장점은 초기 JS를 줄여 KPI와 텍스트가 먼저 보이게 한 점입니다. 단점은 차트 청크를 별도로 내려받는 추가 요청이 생긴다는 점입니다. 이를 보완하기 위해 기존 Skeleton 높이를 재사용해 차트 로딩 중 레이아웃 시프트를 줄였습니다.

---

## AI 사용 내역

- **AI가 한 것**: 컴포넌트 초안 생성, 컴포넌트 분리/공통화 시 코드 작성, 테스트 케이스 보강, DockerFile 작성 보조
- **개발자가 결정한 것**: 사용자 유형 해석, 페이지 구조, 리스크 산식, PCF/GHG 데이터 분리, 배출계수 버전 이력 모델, Docker 실행 방식, 어떤 기능을 제외할지에 대한 판단
- **AI 생성 코드 검토**: 변경 후 `pnpm build`, `pnpm test:run`, Docker build를 통해 검증하고, 실제 화면 렌더링과 import 흐름을 확인

Claude Code와 Codex를 함께 사용했습니다. AI는 구현 속도를 높이는 보조 도구로 사용했고, 서비스 구현 방향성 및 도메인 해석과 아키텍처 결정 등은 직접 결정했습니다.

---

## 소요 시간

| 단계                                              | 소요 |
|-------------------------------------------------| --- |
| 과제 요구사항 분석, GHG/PCF 도메인 정리                      | 약 0.5일 |
| Dashboard, Companies, Company Detail 기본 화면 구현   | 약 1일 |
| Risk, 배출원 분석, Scope별 감축 시나리오 구현                 | 약 1일 |
| Posts 기능 구현(Action Notes, 낙관적 업데이트, 실패 롤백 처리)   | 약 0.5일 |
| PostgreSQL 전환, Route Handler, Docker Compose 구성 | 약 0.5일 |
| Excel import, 배출계수 DB 조회, PCF 계산 저장             | 약 0.5일 |
| 테스트, 빌드 검증, 문서 정리                               | 약 1일 |

가장 복잡했던 부분은 Excel 원본 활동 데이터와 기존 GHG 배출량 데이터를 섞지 않고 분리한 뒤, `emission_factors`의 유효 버전을 조회해 `activity_records`에 계산 스냅샷을 남기는 구조였습니다. 단순히 화면에서 계산만 하면 빠르지만, 과거 산정 결과 재현성과 배출계수 변경 이력을 설명하기 어렵기 때문에 DB 모델과 import 흐름을 함께 설계했습니다.

---
