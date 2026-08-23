# Research: 면접 준비 문제 조회 (Question Viewer MVP)

**Feature**: 001-question-viewer · **Date**: 2026-08-21

이 문서는 spec에 남아 있던 기술적 미결정 사항과 Constitution 제약 하에서의 라이브러리/패턴 선택을 정리한다. 각 항목은 결정 · 근거 · 검토한 대안 3단으로 기록한다.

---

## R1. 아이디 기반 인증을 Supabase Auth로 구현하는 방법

**Decision**: Supabase Auth의 email/password 흐름을 그대로 사용하되, 사용자가 입력한 아이디(username)를 서버 측에서 **`{username_normalized}@my-interview.local`** 형태의 합성 이메일로 변환하여 저장한다. 사용자에게는 "아이디"만 노출한다. 별도의 `profiles` 테이블에 `id (auth.users.id FK)`와 `username`을 저장하여 공개 문제집에서 소유자 이름을 렌더링할 때 사용한다.

**Rationale**:
- Supabase Auth는 이메일/전화/OAuth를 1급 시민으로 지원하지만 순수 username은 지원하지 않는다.
- 커스텀 auth(bcrypt + JWT)는 Constitution IV(Supabase-only)와 I(Simplicity)를 동시에 훼손한다. 세션 쿠키 관리, 비밀번호 정책, 재해싱 등 전부 직접 구현해야 함.
- 합성 이메일 패턴은 Supabase 커뮤니티에서 가장 널리 쓰이는 우회 방법이며, 사용자 UX에는 이메일이 절대 노출되지 않는다.
- `profiles` 테이블은 어차피 필요(FR-023: 소유자 표시). 여기 저장된 `username`이 실질적 사용자 식별자다.

**Alternatives considered**:
- **Supabase의 Phone Auth 필드에 username 저장**: 형식 검증이 국제전화번호 스킴에 묶여 있어 부자연스럽고, SMS/OTP 관련 필드가 잠재적 혼란을 유발.
- **커스텀 auth 전체 구현**: Constitution 위반, 개인 프로젝트에 과도한 복잡성.
- **Supabase Auth 대신 GitHub/Google OAuth**: 스펙이 명시적으로 "아이디/비밀번호만"이라고 못박음(사용자 요구).

**Impact on spec/plan**:
- `lib/username.js`가 정규화(lowercase, trim)와 이메일 합성을 담당.
- `profiles` 테이블에 `username` unique 제약을 걸어 FR-002(중복 아이디 거부)를 DB 수준에서 강제.
- 비밀번호 최소 8자는 Supabase 대시보드의 Auth Settings에서 `Password Min Length = 8`로 설정하여 서버·클라이언트 양쪽에서 강제 (FR-003, Assumptions).

---

## R2. Next.js App Router에서 Supabase 세션 관리

**Decision**: `@supabase/ssr` 패키지를 사용해 서버·클라이언트·미들웨어 세 환경 각각에 맞는 클라이언트 팩토리를 만든다. `middleware.js`는 요청마다 세션 쿠키를 리프레시하고 보호된 경로(`/sets`, `/public-sets`, `/`의 로그인 사용자 뷰)로의 접근을 게이트한다.

**Rationale**:
- `@supabase/ssr`은 Next.js App Router용 공식 지원 방식(구 `@supabase/auth-helpers-nextjs`는 유지보수 모드).
- 세션을 서버·클라이언트 모두에서 일관되게 읽을 수 있어 Server Components와 Client Components 어디서든 `auth.uid()`가 정확히 잡힌다.
- 미들웨어에서 세션 리프레시를 하지 않으면 만료된 access token으로 인해 서버 컴포넌트가 미인증 상태로 렌더링될 수 있다(Supabase Next.js 가이드 표준 이슈).

**Alternatives considered**:
- **미들웨어 없이 각 페이지에서 세션 리프레시**: 반복 코드가 많고 놓치기 쉬움.
- **`@supabase/auth-helpers-nextjs` (구 패키지)**: 유지보수 모드, 새 프로젝트 권장 대상 아님.
- **Client-side only auth**: Server Components에서 로그인 여부를 알 수 없어 F5(hard reload) 시 깜빡임과 미인증 렌더링이 발생.

**Impact on spec/plan**:
- 파일: `lib/supabase-browser.js`, `lib/supabase-server.js`, `middleware.js`.
- 인증 게이트(FR-007, FR-015)는 `middleware.js`에서 1차, RLS에서 2차로 이중 방어.

---

## R3. 서버 상태 변경(회원가입/로그인/로그아웃)의 구현 형태

**Decision**: **Server Actions**로 구현. 폼 컴포넌트에서 `action={signup}` 같은 형태로 직접 호출하고, 성공 시 `redirect()`, 실패 시 오류 객체를 반환하여 클라이언트가 표시한다.

**Rationale**:
- 별도의 Route Handler(REST API)를 만들지 않아 파일 수와 API 계약 유지 부담이 줄어든다 (Constitution I).
- 쿠키 헤더 조작이 서버 컨텍스트에서 자연스럽다.
- Vercel Functions로 자동 매핑되어 배포 이슈 없음 (Constitution III).

**Alternatives considered**:
- **Route Handlers(`app/api/auth/*/route.js`)**: 페이지 폼에서 fetch로 호출해야 하고, 오류 처리와 리다이렉트를 명시적으로 관리해야 함. 코드가 늘어남.
- **Client-side only(Supabase JS를 브라우저에서 직접 호출)**: 브라우저에 세션 쿠키를 심는 것은 여전히 가능하지만, Next.js SSR와의 통합(리다이렉트, 서버 리렌더링)이 서투르게 된다.

**Impact on spec/plan**:
- `lib/auth-actions.js`에 `signUp`, `signIn`, `signOut` Server Action 정의.
- 문제집·문제의 CRUD는 **Server Components + Supabase**(Server Components에서 조회) + **Server Actions**(mutation) 조합으로 구현. RLS가 실질 권한 통제.

---

## R4. 데이터 접근 계층: ORM vs 직접 SQL vs Supabase 클라이언트

**Decision**: **Supabase JS 클라이언트를 직접 사용**한다. ORM(Prisma, Drizzle 등)이나 리포지토리 패턴 도입 없음.

**Rationale**:
- Constitution I(Simplicity), IV(Supabase-only) 정면 정렬.
- 이 스펙의 도메인은 3개 테이블·10여 개 CRUD 오퍼레이션 수준 → ORM의 오버헤드가 이득을 압도.
- Supabase 클라이언트의 체이닝 API(`.from('...').select(...).eq(...)`)가 이미 충분히 읽기 쉬움.

**Alternatives considered**:
- **Prisma**: 스키마 파일과 마이그레이션이 이중 관리(SQL 파일과 병존)되어 사용자 요구("SQL 파일 하나로 관리, 내가 직접 실행")를 정면 위반.
- **Repository / Service 레이어 추상화**: 함수 3~4개짜리 도메인에서 헛된 추상화. YAGNI.

**Impact on spec/plan**:
- 각 페이지·액션에서 필요한 만큼 Supabase 클라이언트를 호출. 재사용이 필요한 부분(예: "내 문제집 목록 쿼리")만 `lib/`의 순수 함수로 뽑는다.

---

## R5. 스키마 관리 방식(마이그레이션 도구 도입 여부)

**Decision**: **마이그레이션 도구를 도입하지 않는다.** 스키마의 단일 정보원(single source of truth)은 리포지토리의 `supabase/schema.sql` 파일 한 개이며, 사용자가 Supabase 대시보드의 **SQL Editor → New query → Run**으로 직접 적용한다. 스키마 변경 시 이 파일을 갱신하고 필요한 부분만 다시 실행한다 (`create table if not exists`, `drop policy if exists ... create policy` 등 idempotent 패턴 사용).

**Rationale**:
- 사용자 명시 요구: "Supabase에 올릴 SQL 파일도 따로 만들어줘야 해. 그건 내가 직접 할게."
- Supabase CLI 마이그레이션은 로컬 도커·CLI 설치·마이그레이션 폴더 규약·CI 통합을 요구 → 개인 학습 프로젝트에 과잉.
- 스키마가 3개 테이블로 작아 idempotent 스크립트로도 충분히 관리 가능.

**Alternatives considered**:
- **Supabase CLI + `supabase/migrations/*.sql`**: 표준적이지만 사용자가 명시적으로 원치 않음. 팀 프로젝트로 커질 때 재검토.
- **Prisma migrate**: R4에서 이미 기각.
- **SQL 파일 여러 개(`001_init.sql`, `002_add_x.sql` ...)**: 관리 오버헤드만 늘고, 마이그레이션 도구가 없으니 순서 실행 책임이 사용자에게 남아 실수 위험.

**Impact on spec/plan**:
- 파일: `supabase/schema.sql` (본 계획 phase에서 즉시 생성).
- README에 "SQL 적용 절차" 문단 추가 필요 → tasks에 반영.

---

## R6. 클라이언트 상태 관리(학습 세션 진행 상태)

**Decision**: 학습 세션 상태(현재 문제 인덱스, 암기 모드의 "내용 보기" 활성 여부)는 **URL 쿼리 파라미터 + React `useState`만으로 관리**한다. 전역 상태 라이브러리(Redux, Zustand 등) 도입 없음. localStorage/쿠키에 진행 위치 저장 없음.

**Rationale**:
- FR-022: "이어서 하기" 기능 없음, 진행 위치를 세션 간 저장하지 않음 → 사용자 명시 요구.
- URL에 `?mode=study&i=3`처럼 인코딩하면 새로고침·뒤로가기·공유가 자연스럽게 동작.
- Constitution I(Simplicity): 라이브러리 최소화.

**Alternatives considered**:
- **Zustand/Context Provider**: 이 스펙에 전역 상태가 필요한 지점이 없음.
- **localStorage에 진행 저장**: FR-022 정면 위반.

**Impact on spec/plan**:
- Study 페이지 URL 스킴: `/sets/:id/study?mode={study|memorize}&i={index}`. `mode` 없으면 학습 목록으로 리다이렉트.
- "내용 보기" 상태는 컴포넌트 로컬 `useState`, 다음/이전 이동 시 새 문제 진입으로 리셋되므로 자연스럽게 초기화됨 (FR-021).

---

## R7. 키워드 저장 형태의 Postgres 매핑

**Decision**: `keywords TEXT[] NOT NULL DEFAULT '{}'` — Postgres의 네이티브 배열 타입. 인덱싱은 하지 않는다(검색 기능 없음).

**Rationale**:
- Clarify Q2에서 확정: 순서 있는 문자열 배열.
- Supabase 클라이언트가 배열을 JS `Array<string>`으로 자연스럽게 매핑.
- 별도의 `keywords` 테이블 + m:n 관계는 스펙의 "키워드는 문제와 함께 저장되며 독립적으로 존재하지 않는다" 정의와 불일치, 조인 비용도 발생.

**Alternatives considered**:
- **`JSONB` 컬럼**: 순서 배열은 배열 타입이 더 자연스럽고 타입 안전.
- **별도 테이블**: R2 근거대로 오버스펙.

**Impact on spec/plan**:
- data-model에 `keywords TEXT[]` 반영. `KeywordInput` 컴포넌트가 콤마/엔터 분리, 중복 제거, 앞뒤 공백 트림을 저장 전에 처리 (FR-010a/b/c).

---

## R8. 미인증 사용자 리다이렉트 위치와 흐름

**Decision**: 미인증 사용자가 보호된 경로에 접근하면 `middleware.js`에서 `/login`으로 302 리다이렉트하고, 쿼리스트링에 `?next=/원래경로`를 붙여 로그인 후 원래 위치로 복귀한다. 비공개 문제집 존재 여부는 유출하지 않기 위해, 로그아웃 상태에서는 `/sets/*` 접근도 무조건 `/login`으로 보낸다(FR-015, Edge Case).

**Rationale**:
- 사용자 경험(로그인 후 복귀)과 보안(비공개 리소스 존재 유출 방지)을 동시에 만족.

**Alternatives considered**:
- **404 반환**: 미인증 사용자에게 로그인 안내가 없어 UX 저하.
- **홈으로 리다이렉트**: 사용자가 원래 하려던 것을 다시 찾아가야 함.

**Impact on spec/plan**:
- `middleware.js` matcher에 `/`, `/sets/:path*`, `/public-sets/:path*` 포함. `/login`, `/signup`은 제외.

---

## R9. 개발 환경 · CI 없음

**Decision**: CI 파이프라인, 자동 테스트, 린트 프리커밋 훅을 이 스펙 범위에서 도입하지 않는다. `npm run lint`는 Next.js 기본 ESLint 구성만 유지.

**Rationale**:
- Constitution IV(테스트 optional), 사용자 목표(학습·간결함).
- Vercel의 기본 빌드가 이미 `next build` 실패 시 배포를 막아주므로 최소한의 회귀 방어는 존재.

**Impact on spec/plan**:
- `.github/workflows/*` 등 CI 파일 생성 안 함.
