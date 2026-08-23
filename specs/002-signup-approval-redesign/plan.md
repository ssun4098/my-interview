# Implementation Plan: 회원가입 승인제 도입 및 UI 전면 재디자인

**Branch**: `002-signup-approval-redesign` | **Date**: 2026-08-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-signup-approval-redesign/spec.md`

## Summary

두 개의 P1 사용자 스토리를 하나의 배포에 묶는다. **US1**은 `profiles`에 `is_approved` 컬럼을 하나 추가하고 인증 흐름·RLS 정책·미들웨어에 그 값을 검사하는 얇은 층을 얹는다. **US2**는 기존의 임시 스타일을 폐기하고 [DESIGN.md](../../DESIGN.md)의 배달의민족 디자인 토큰(색·타이포·간격·라운드·엘리베이션·애니메이션)을 CSS 커스텀 프로퍼티로 옮긴 뒤, 반응형 앱 셸(모바일: 하단 3탭 · 데스크톱: 상단 nav)과 몇 개의 재사용 컴포넌트(Button, TextField, Chip, Card, Badge, BottomTabBar, TopNav)를 새로 만든다. 기존 페이지의 데이터 흐름과 라우팅은 대부분 그대로 유지되며 시각 표면만 재작성된다.

폰트는 **CDN 링크**로 로드하고(jsDelivr의 fonts-archive + Pretendard CDN), 다크 모드·i18n·완전 a11y 인증은 이번 스펙 범위 밖이다. 승인 상태 변경 UI는 만들지 않고 사용자가 Supabase 대시보드에서 직접 값을 뒤집는다. 새로운 페이지는 `/profile` 하나만 추가된다.

## Technical Context

**Language/Version**: JavaScript (Node 20 LTS) — 변경 없음, Constitution II 유지.

**Primary Dependencies** (spec 001 유지 + 신규 없음):
- `next` ^14.2, `react`/`react-dom` ^18.3
- `@supabase/supabase-js` ^2, `@supabase/ssr` ^0.5
- **아이콘 라이브러리 미도입** — 3탭 + 소수의 액션 아이콘은 inline SVG로 처리 (Constitution I: 20줄 이내로 가능한 것은 의존성 추가하지 않음)
- **CSS-in-JS 라이브러리 미도입** — 순수 CSS + CSS 커스텀 프로퍼티 (Constitution 기술 제약)

**Storage**: Supabase Postgres. 이 스펙에서의 변경:
- `profiles.is_approved BOOLEAN NOT NULL DEFAULT false` 컬럼 추가
- 기존 행은 마이그레이션 시점에 모두 `true`로 백필 (FR-109, 소유자 접근 유지)
- `question_sets`·`questions`의 RLS `USING` 절에 "요청자가 승인된 프로필" 조건 추가

**Testing**: 없음 (spec 001과 동일 원칙). 검증은 수동 브라우저 + [quickstart.md](./quickstart.md).

**Target Platform**: Vercel (변경 없음). 반응형 웹앱으로서 모바일 브라우저(뷰포트 ≤ 640px)와 데스크톱 브라우저(≥ 1024px) 양쪽 지원. 네이티브 앱 아님.

**Project Type**: 단일 Next.js 웹 애플리케이션 (변경 없음).

**Performance Goals**:
- SC-107: 학습 모드 "다음" 액션 → 다음 문제 표시 ≤ 1초 (기존 유지)
- SC-108: 초기 로드 필수 폰트·CSS·JS 총 다운로드 ≤ 500KB (gzip). BM 한나체 하나(약 90KB woff2) + Pretendard variable(약 150KB) + 앱 번들 → 여유 있게 통과

**Constraints**:
- Constitution 5원칙 유지 (Simplicity, JS-only, Vercel-ready, Supabase-only, README documented)
- **다크 모드 미지원** (FR-214)
- 폰트 로딩 실패 시 시스템 sans-serif fallback (FR-213)
- Service role key는 Server Actions·admin flow에서만 사용 (spec 001의 `signUp` 재사용)

**Scale/Scope**: 개인 학습용 MVP. 승인 대기 큐 크기 = 스팸 여부에 따라 다르지만 자연 발생량은 무시 가능(공개 URL이더라도).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | 원칙 | 확인 | 위반 여부 |
|---|------|------|-----------|
| I | Simplicity First | 신규 컬럼 1개, 신규 페이지 1개(/profile), 신규 컴포넌트 6개(Button·TextField·Chip·Card·TopNav·BottomTabBar), 신규 의존성 0개. 라이브러리(lucide 등) 도입 없이 inline SVG로 해결 | ✅ Pass |
| II | JavaScript Only | 신규 파일 전부 `.js`. TS 도입 없음 | ✅ Pass |
| III | Vercel-Ready | 커스텀 서버 없음, 폰트 CDN 링크로 로드(런타임 FS 쓰기 없음), 미들웨어에서 추가로 profile 조회만 함(서버리스 함수 시간 내) | ✅ Pass |
| IV | Supabase Only | 승인 상태도 Supabase profiles 테이블에 저장, RLS로 강제. 별도 auth 서비스 없음 | ✅ Pass |
| V | Structure Documented | 신규 페이지·컴포넌트·마이그레이션 절차는 README에 반영 필요 (tasks에 포함될 예정) | ✅ Pass (유지 책임) |

**Complexity Tracking**: 없음. 게이트 위반 없음.

## Project Structure

### Documentation (this feature)

```text
specs/002-signup-approval-redesign/
├── plan.md              # 이 파일
├── research.md          # Phase 0 (기술 결정)
├── data-model.md        # Phase 1 (스키마 변경)
├── quickstart.md        # Phase 1 (수동 검증 절차)
├── contracts/
│   ├── README.md
│   ├── auth-actions.md      # signUp/signIn 변경점
│   ├── data-access.md       # RLS 변경 · profile 조회
│   └── design-system.md     # DESIGN.md → CSS 변수 매핑 계약
└── tasks.md             # /speckit-tasks가 생성
```

### Source Code (repository root)

기존 트리(spec 001) 위에 얹는 **증분 변경**:

```text
my-interview/
├── app/
│   ├── layout.js                       # 수정: 새 폰트 <link>, 새 Nav 구조로 교체
│   ├── globals.css                     # 대폭 재작성: DESIGN.md 토큰을 CSS 변수로, 반응형 규칙
│   ├── page.js                         # 변경 없음
│   ├── (auth)/
│   │   ├── login/page.js               # 수정: signup 성공 배너 렌더 (?signedUp=1 파라미터)
│   │   └── signup/page.js              # 수정: 성공 시 /login?signedUp=1로 리다이렉트
│   ├── sets/                           # 페이지 로직 유지, 스타일링만 재작성
│   ├── public-sets/                    # 동일
│   └── profile/
│       └── page.js                     # ★ 신규: 아이디 + 로그아웃 (프로필 탭 진입점)
├── components/
│   ├── AppShell.js                     # ★ 신규 client component: usePathname()으로 study 경로 감지 + 뷰포트별 nav 렌더
│   ├── TopNav.js                       # ★ 신규: 데스크톱 상단 nav (배민식 헤더 톤)
│   ├── BottomTabBar.js                 # ★ 신규: 모바일 하단 3탭
│   ├── Button.js                       # ★ 신규: DESIGN.md button-primary/mint/ghost 변형
│   ├── TextField.js                    # ★ 신규: DESIGN.md text-field 사양
│   ├── Chip.js                         # ★ 신규: DESIGN.md tag/badge 어휘 (KeywordInput가 사용)
│   ├── Card.js                         # ★ 신규: DESIGN.md 카드 컨테이너 (list-row/study 카드가 사용)
│   ├── Nav.js                          # 삭제 (AppShell + TopNav/BottomTabBar가 대체)
│   ├── KeywordInput.js                 # 수정: 내부 chip을 <Chip> 컴포넌트로 교체
│   ├── QuestionSetForm.js              # 수정: TextField/Button 컴포넌트 사용
│   ├── QuestionForm.js                 # 수정: 동일
│   └── StudyView.js                    # 수정: Card + Button 컴포넌트 사용, 카드 톤 재작성
├── lib/
│   ├── auth-actions.js                 # 수정: signUp은 profile insert 시 is_approved 명시하지 않음(default false), signIn은 로그인 후 is_approved 확인
│   ├── set-actions.js                  # 변경 없음 (RLS가 알아서 막음)
│   ├── question-actions.js             # 변경 없음
│   ├── queries.js                      # 변경 없음
│   ├── supabase-server.js              # 변경 없음
│   ├── supabase-browser.js             # 변경 없음
│   ├── supabase-admin.js               # 변경 없음
│   ├── username.js                     # 변경 없음
│   └── profile.js                      # ★ 신규: 현재 사용자의 profile row (username·is_approved) 조회 헬퍼
├── supabase/
│   └── schema.sql                      # 수정: is_approved 컬럼 + 백필 + RLS 정책 갱신 (idempotent)
├── middleware.js                       # 수정: 세션 확인에 더해 profiles.is_approved 조회, 미승인이면 /login?revoked=1로 리다이렉트 후 signOut
└── README.md                           # 수정: 새 폴더 구조 반영, "승인 상태를 승인함으로 바꾸는 방법(SQL 한 줄)" 추가
```

**Structure Decision**:
- **AppShell + 라우트 감지 방식**을 채택. Next.js 라우트 그룹(`(with-tabs)` / `(no-tabs)`)으로도 표현 가능하지만, 그 방식은 폴더 대량 이동을 요구하고 study 페이지가 그 구분 밖에 있어야 하는 어색한 재배치가 생김. Client 컴포넌트 하나에서 `usePathname()` 체크가 훨씬 얇음 (Constitution I).
- **폰트는 CDN 링크** (`<link rel="preconnect" href="https://cdn.jsdelivr.net" />` + fonts-archive URL, Pretendard도 동일). Self-host는 폰트 3~5종 각각을 `public/fonts/`에 두고 CSS `@font-face`를 써야 해서 초기 학습·유지비가 큼. CDN이 SC-108(500KB gzip) 안에 충분히 들어옴.
- **아이콘은 inline SVG**. lucide-react 같은 라이브러리를 도입하면 트리셰이킹 후에도 초기 번들 몇 KB가 늘고, 우리가 실제로 쓸 아이콘은 10개 미만. `components/icons/` 폴더에 SVG 컴포넌트들을 두거나 필요한 자리에 인라인.
- **`components/Nav.js`는 삭제**하고 새 3-파일 구조(AppShell/TopNav/BottomTabBar)로 교체 — 이전 파일이 반응형 요구와 study 모드 숨김을 담기에는 너무 얇았음.

## Complexity Tracking

*게이트 위반 없음, 이 표는 비워 둠.*

## Post-Design Constitution Re-check

Phase 1 아티팩트 작성 후:

| # | 원칙 | 결과 |
|---|------|------|
| I | Simplicity First | 최종 신규 컴포넌트 7개(AppShell 포함), 신규 lib 1개, 신규 페이지 1개, 신규 컬럼 1개. 새 의존성 0개. 초심자가 여전히 한 세션에 훑을 수 있는 규모. ✅ |
| II | JS Only | 모든 신규/수정 파일 `.js` / `.jsx`. ✅ |
| III | Vercel-Ready | 미들웨어에 profile 조회 1회 추가 — Supabase는 Vercel 리전과 같은 리전이라 오버헤드 미미. FS 쓰기 없음. ✅ |
| IV | Supabase Only | 승인 상태도 profiles에 저장, RLS로 강제. 별도 서비스 없음. ✅ |
| V | README | tasks에 README 갱신 태스크 포함 예정. ✅ |

**Result**: 통과. 변경 없음.
