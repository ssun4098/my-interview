# Implementation Plan: 면접 준비 문제 조회 (Question Viewer MVP)

**Branch**: `001-question-viewer` | **Date**: 2026-08-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-question-viewer/spec.md`

## Summary

Next.js(App Router) + Supabase 기반의 개인 면접 준비 앱 MVP를 구축한다. 우선순위 P1(문제집을 순서대로 하나씩 학습/암기 모드로 조회)이 반드시 동작해야 하며, 계정 인증(P2), 문제집·문제 CRUD(P2), 공개 문제집 둘러보기(P3)까지 이 스펙 범위에 포함된다.

기술 접근은 **최대한 얇은 스택**이다. Next.js 서버 컴포넌트에서 Supabase를 직접 호출(RLS로 권한 통제), 인증 흐름(회원가입/로그인/로그아웃)만 Server Actions로 처리하여 쿠키 세션을 관리한다. 별도의 REST 백엔드 계층이나 ORM은 두지 않는다. 사용자는 아이디("username")만으로 인증하도록 노출되지만, 내부적으로는 Supabase Auth의 email/password를 그대로 사용하고 아이디에 고정 도메인(`{username}@my-interview.local`)을 합성한 값을 email로 저장한다(자세한 근거는 [research.md](./research.md) 참고).

DB 스키마와 RLS 정책은 리포지토리의 [`supabase/schema.sql`](../../supabase/schema.sql)에 한 파일로 관리하고, 사용자가 Supabase 대시보드의 SQL Editor에서 직접 실행한다(마이그레이션 도구 도입하지 않음, 사용자 요청).

## Technical Context

**Language/Version**: JavaScript (Node 20 LTS). TypeScript · `tsconfig.json` · `@types/*` 사용 금지 (Constitution II).

**Primary Dependencies**:
- `next` (^14.2, App Router)
- `react`, `react-dom` (^18)
- `@supabase/supabase-js` (^2)
- `@supabase/ssr` (^0.5, Next.js 서버 통합 · 쿠키 세션 처리)

**Storage**: Supabase Postgres (managed). 3개 테이블(`profiles`, `question_sets`, `questions`)과 Row Level Security 정책으로 접근 제어. 마이그레이션 도구 없음 — `supabase/schema.sql` 파일을 사용자가 SQL Editor에서 수동 실행.

**Testing**: **없음** (Constitution IV: 자동 테스트는 spec이 명시 요청한 경우에만 도입, 이 스펙은 요청 없음). 검증은 수동 브라우저 확인 + [`quickstart.md`](./quickstart.md)의 시나리오.

**Target Platform**: Vercel (Next.js Runtime, serverless). 커스텀 서버 없음, 로컬 FS 쓰기 없음, 백그라운드 워커 없음 (Constitution III).

**Project Type**: 단일 Next.js 웹 애플리케이션. 모노레포/멀티패키지 아님. `frontend/`·`backend/` 분리 없음. 프로젝트 구조는 Constitution V에 따라 README에 문서화됨.

**Performance Goals**:
- 로그인 → 첫 문제 표시 ≤ 5초 (SC-001)
- "다음" 액션 → 다음 문제 표시 ≤ 1초 (SC-006)
- 문제집당 100문제 이하에서 지연 없는 순회 (SC-007)

**Constraints**:
- Vercel serverless 실행 모델 준수: 커스텀 서버·백그라운드 프로세스·런타임 파일 쓰기 금지 (Constitution III).
- 서비스 롤 키는 Server Component / Route Handler / Server Action에서만 사용, 클라이언트 번들에 절대 포함 금지 (Constitution IV).
- `NEXT_PUBLIC_` 접두사 여부로 브라우저 노출 여부를 명확히 구분.

**Scale/Scope**: 개인 학습용 MVP. 초기 목표: 단일 리전, 소수 사용자, 문제집당 ~100문제, 사용자당 ~수십 개의 문제집. 관리자 개념 없음(모든 로그인 사용자 동등).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | 원칙 | 확인 | 위반 여부 |
|---|------|------|-----------|
| I | Simplicity First (NON-NEGOTIABLE) | 단일 Next.js 앱, App Router 하나, 폴더 5개(`app/`·`components/`·`lib/`·`public/`·`supabase/`), ORM/추가 백엔드 계층 없음, 테스트 프레임워크 없음 | ✅ Pass |
| II | JavaScript Only | 모든 파일 `.js`/`.jsx`. `tsconfig.json` 생성 금지. `create-next-app`은 `--js` 플래그 사용 | ✅ Pass |
| III | Vercel-Ready by Default | 커스텀 서버 없음, `output: 'standalone'` 아님, 런타임 FS 쓰기 없음, 세션은 Supabase가 쿠키로 관리 | ✅ Pass |
| IV | Supabase Is the Only Backend | 인증·데이터·(향후 필요 시 파일)은 모두 Supabase. 별도 DB/ORM/API 서버 없음. Service Role Key는 서버 코드에서만 | ✅ Pass |
| V | Structure Documented in README (NON-NEGOTIABLE) | README에 폴더 트리·env·로컬 실행·Vercel 배포·SQL 적용 절차를 유지. 스캐폴딩 완료 시 README 업데이트가 tasks에 포함될 것 | ✅ Pass (유지 책임 있음) |

**Result**: 모든 게이트 통과. Complexity Tracking 없음.

## Project Structure

### Documentation (this feature)

```text
specs/001-question-viewer/
├── plan.md              # 이 파일
├── research.md          # Phase 0 출력
├── data-model.md        # Phase 1 출력
├── quickstart.md        # Phase 1 출력
├── contracts/           # Phase 1 출력
│   ├── README.md
│   ├── auth-actions.md
│   └── data-access.md
└── tasks.md             # /speckit-tasks가 생성 (본 명령에서는 생성하지 않음)
```

### Source Code (repository root)

```text
my-interview/
├── app/                              # Next.js App Router: 폴더=경로, page.js=페이지
│   ├── layout.js                     # 루트 레이아웃 (Nav 포함, footer 없음)
│   ├── page.js                       # "/" 홈: 로그인 상태에 따라 리다이렉트
│   ├── (auth)/
│   │   ├── login/page.js             # "/login"
│   │   └── signup/page.js            # "/signup"
│   ├── sets/                         # 내 문제집
│   │   ├── page.js                   # "/sets" 내 문제집 목록
│   │   ├── new/page.js               # "/sets/new" 문제집 생성 폼
│   │   └── [id]/
│   │       ├── page.js               # "/sets/:id" 상세 + 문제 관리
│   │       ├── edit/page.js          # "/sets/:id/edit" 제목/공개여부 편집
│   │       ├── questions/
│   │       │   ├── new/page.js       # "/sets/:id/questions/new"
│   │       │   └── [qid]/edit/page.js # "/sets/:id/questions/:qid/edit"
│   │       └── study/page.js         # "/sets/:id/study?mode=study|memorize&i=N"
│   └── public-sets/                  # 공개 문제집 둘러보기 (US4)
│       ├── page.js                   # "/public-sets" 목록
│       └── [id]/
│           ├── page.js               # "/public-sets/:id"
│           └── study/page.js         # "/public-sets/:id/study?mode=...&i=..."
├── components/                       # 재사용 UI
│   ├── Nav.js                        # 로그인 상태 반영, 로그아웃 버튼
│   ├── QuestionSetForm.js            # 문제집 생성/편집 공용
│   ├── QuestionForm.js               # 문제 생성/편집 공용 (키워드 chip 입력)
│   ├── KeywordInput.js               # 콤마/엔터로 chip 분리
│   └── StudyView.js                  # 학습/암기 모드 렌더러
├── lib/                              # 순수 JS 헬퍼
│   ├── supabase-browser.js           # 브라우저용 클라이언트 (anon key)
│   ├── supabase-server.js            # 서버용 클라이언트 (Server Components/Actions)
│   ├── auth-actions.js               # signup/login/logout Server Actions
│   └── username.js                   # username ↔ synthetic email 변환·정규화
├── supabase/
│   └── schema.sql                    # ★ 사용자가 Supabase SQL Editor에서 직접 실행
├── public/                           # 정적 파일
├── middleware.js                     # Supabase 세션 쿠키 리프레시
├── .env.example
├── .env.local                        # gitignored
├── .gitignore
├── jsconfig.json                     # 경로 별칭 "@/*"
├── next.config.js
├── package.json
└── README.md
```

**Structure Decision**:
- **단일 Next.js 앱**을 선택. 사용자가 Next.js 초심자이며 Constitution "Simplicity First" 원칙상, `frontend/`·`backend/` 분리나 모노레포는 부적절.
- **App Router**만 사용, 예전 `pages/` 라우터는 도입 금지 (Constitution 및 create-next-app 최신 기본값과 정렬).
- 라우트 그룹 `(auth)`는 `/login`·`/signup`을 하나의 레이아웃 컨벤션으로 묶기 위한 순수 그룹핑(경로에 반영되지 않음).
- **DB 스키마 파일은 `supabase/schema.sql` 한 파일**로 유지. 마이그레이션 도구를 도입하지 않으므로 스키마 변경은 이 파일을 갱신하고 사용자가 다시 실행하는 방식(사용자 요청).
- **`middleware.js`**는 Next.js 표준 Supabase SSR 통합 패턴으로, 요청마다 쿠키 세션을 리프레시하는 얇은 파일. 라우팅 보호(로그인 강제)도 여기서 처리.

## Complexity Tracking

*게이트 위반 없음. 이 표는 비워 둠.*

## Post-Design Constitution Re-check

Phase 1 아티팩트(data-model, contracts, quickstart, supabase/schema.sql, 소스 트리 결정) 작성 후 재확인:

| # | 원칙 | 재확인 결과 |
|---|------|-------------|
| I | Simplicity First | 최종 트리 폴더 수 5개(도메인 폴더 미포함), 컴포넌트 5개, 헬퍼 4개. 초심자가 한 세션에 훑을 수 있는 규모. ✅ |
| II | JavaScript Only | 확정된 의존성 목록에 TS/타입 패키지 없음. `.js`만 스캐폴딩. ✅ |
| III | Vercel-Ready | 커스텀 서버 없음, 모든 auth 상태는 Supabase 쿠키. Route Handler·Server Action은 Vercel Functions로 자동 매핑. ✅ |
| IV | Supabase Only | 3개 테이블 + RLS로 모든 도메인 로직 표현. 별도 서버/DB 없음. ✅ |
| V | README 유지 | README에 `supabase/schema.sql` 적용 절차 추가 필요 → tasks에 반영. ✅ (계획됨) |

**Result**: 재확인 통과, 변경사항 없음.
