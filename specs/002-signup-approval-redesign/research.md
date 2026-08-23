# Research: 회원가입 승인제 도입 및 UI 전면 재디자인

**Feature**: 002-signup-approval-redesign · **Date**: 2026-08-22

이 문서는 spec에서 planning 단계로 넘기며 결정한 기술 항목들을 근거와 함께 기록한다. 각 항목은 결정 · 근거 · 검토 대안 3단이다.

---

## R1. 승인 상태의 스토리지 형태

**Decision**: `profiles` 테이블에 `is_approved BOOLEAN NOT NULL DEFAULT false` 컬럼 하나. 상태값 = { false = 승인 대기, true = 승인됨 }. 승인 시각(`approved_at`)이나 이력 테이블은 만들지 않는다.

**Rationale**:
- 스펙(FR-101)이 최소 두 값을 요구하고, 그 이상은 요구하지 않음.
- 소유자가 SQL 한 줄로 뒤집는 UX가 목표(`update profiles set is_approved = true where username = '…';`).
- boolean이면 RLS 정책이 `and (select is_approved from profiles where id = auth.uid())` 같이 짧게 표현됨.
- 이력이 필요해지면 후속 스펙에서 `approval_events` 감사 테이블을 별도로 붙일 수 있음(현재는 YAGNI).

**Alternatives considered**:
- **enum `status`** (`pending` / `approved` / `rejected` / `banned`): 확장성 좋지만 현재 요구는 두 값. 소유자가 상태값을 외워야 하는 인지 부담이 생김.
- **별도 `pending_users` 테이블**: 승인 시 profiles로 이동. 두 테이블을 오가는 트랜잭션 필요, 조회 경로가 갈라져서 복잡도가 큼.

**Impact**:
- data-model.md에 `is_approved` 필드 추가
- `supabase/schema.sql`에 `alter table ... add column if not exists is_approved boolean not null default false;` + 기존 행 백필 + RLS 정책 update
- `lib/profile.js` 새로 만들어 profile row 조회 캐싱

---

## R2. RLS 정책에서의 승인 검사 위치

**Decision**: `question_sets`·`questions` 두 테이블의 모든 정책(`SELECT` / `INSERT` / `UPDATE` / `DELETE`)의 `USING`·`WITH CHECK` 절 앞부분에 다음 조건을 AND로 추가한다:

```sql
exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_approved = true)
```

`profiles` 자신의 정책은 그대로 두어(승인되지 않은 사용자도 자기 profile은 읽을 수 있어야 함 — 승인 상태 자체를 미들웨어에서 조회하기 위해), 승인 검사는 도메인 테이블에서만 강제한다.

**Rationale**:
- **defense-in-depth**: 미들웨어가 통과시켜도 DB가 두 번째로 차단한다.
- 승인되지 않은 사용자가 어떤 방법(직접 API 호출 포함)으로 접근하더라도 문제집·문제 데이터에 손댈 수 없다.
- `profiles`를 검사에서 제외하는 이유: 미들웨어와 프로필 페이지가 자기 자신의 승인 상태를 읽어야 하는데, 그것마저 막으면 순환.

**Alternatives considered**:
- **모든 테이블에 대해 승인 강제**: `profiles`도 막으면 미들웨어가 profile을 못 읽어서 로그아웃 흐름조차 실패.
- **미들웨어에서만 검사, RLS는 그대로**: 얇지만 미들웨어를 우회할 여지가 남음(직접 fetch 등).

**Impact**:
- `supabase/schema.sql`의 6개 policy(질문셋 CRUD 4개 + 문제 CRUD 4개 중 SELECT 제외한 서브셋 대상) 갱신
- 정책은 `drop policy if exists ... create policy ...` 패턴으로 idempotent 유지

---

## R3. 로그인 시 승인 검사와 오류 우선순위

**Decision**: `signIn` Server Action의 흐름:
1. `signInWithPassword({ email, password })` 먼저 호출.
2. 실패면 통합 오류("아이디 또는 비밀번호가 올바르지 않습니다") 반환 — FR-107 우선.
3. 성공하면 즉시 `profiles.is_approved` 조회.
4. `is_approved = false`면 세션을 무효화(`supabase.auth.signOut()`)하고 "아직 승인되지 않은 계정입니다. 관리자에게 문의해 주세요." 반환.
5. `is_approved = true`면 `redirect(next ?? '/sets')`.

**Rationale**:
- FR-107 요구를 정확히 따름: 자격 증명 오류가 승인 상태 유출보다 우선.
- 승인 여부는 이메일 존재 여부로 이미 유추 가능하니(회원가입 시도 시 "이미 사용 중" 오류), 로그인 후에 노출해도 실제 정보 이득은 미미. 그래도 순서만은 spec대로.
- `signOut()`을 명시적으로 호출해 세션 쿠키를 제거 — 그렇지 않으면 브라우저에 짧은 순간 유효 세션이 남는다.

**Alternatives considered**:
- **profile을 email로 미리 조회하고 이후 auth.signInWithPassword**: profile lookup으로 email 존재 여부가 유출됨(현재 흐름과 동일한 위험 수준이지만 순서 규칙 위반).
- **DB 트리거로 pending user의 auth.session을 자동 삭제**: 오버엔지니어링.

**Impact**:
- `lib/auth-actions.js`의 `signIn` 흐름 갱신
- 오류 메시지 상수 추가

---

## R4. 미들웨어에서의 승인 상태 확인

**Decision**: `middleware.js`에서 인증된 사용자에 대해 매 요청마다 `profiles.is_approved`를 한 번 조회한다. `false`면 `/login?revoked=1`로 리다이렉트하고 세션을 무효화. `/profile`과 `/login` 등 공개·자기 자신 경로는 예외.

**Rationale**:
- FR-106: "다음 서버 상호작용부터 차단". 미들웨어 조회가 가장 자연스러운 훅.
- Supabase 리전과 Vercel 리전이 동일하면 profile 조회는 ~5-15ms — SC-107(next 1s 이내)에 영향 미미.
- 페이지·API마다 개별 검사보다 훨씬 유지보수적.

**Alternatives considered**:
- **RLS만으로 방어**: RLS는 도메인 데이터 접근은 막지만, 사용자가 `/sets` 페이지 껍데기(빈 UI)까지는 볼 수 있음. UX가 어색.
- **세션 토큰에 승인 상태를 임베드(JWT claim)**: 승인 상태가 변경돼도 토큰 만료 전까지는 stale. FR-106의 "다음 서버 상호작용부터" 요구를 못 지킴.

**Impact**:
- `middleware.js` 리팩터링
- `lib/profile.js`에 미들웨어·서버 컴포넌트 공용 조회 함수

---

## R5. 폰트 로딩 전략

**Decision**: 폰트는 **CDN `<link>`**로 로드한다.
- Pretendard Variable: `https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/variable/pretendardvariable.min.css`
- BM Hanna Pro (헤드라인용): jsDelivr fonts-archive의 최신 안정 경로
- BM Hanna Air, BM Jua, BM Dohyeon 등 나머지 디스플레이 폰트는 **현재 스펙 범위에서는 사용하지 않음** — 실제 화면에서 필요한 헤드라인 톤이 나올 때만 추가

`app/layout.js`의 `<head>` 안에 `<link rel="preconnect">` + `<link rel="stylesheet">` 2쌍. CSS `font-family` 스택에서 로컬 시스템 sans-serif를 fallback으로 명시(FR-213).

**Rationale**:
- Self-host는 폰트 파일을 `public/fonts/`로 옮기고 `@font-face`를 CSS에 여러 개 써야 함 → 초심자에게 학습 부담 큼(Constitution I).
- CDN이 Vercel edge와도 잘 협업(브라우저가 CDN을 별도로 해시).
- Preconnect로 초기 handshake 지연 축소.
- Pretendard Variable 하나 + BM Hanna 하나만 로드하면 500KB gzip 한도 안에서 충분.

**Alternatives considered**:
- **Self-host with `next/font/local`**: 성능은 최선이지만 파일 관리·라이선스 명시 등 유지 부담. 필요해지면 후속으로 전환 가능.
- **`next/font/google`**: Google Fonts는 Pretendard·BM 시리즈 미제공.

**Impact**:
- `app/layout.js` `<head>` 갱신
- `app/globals.css`의 `font-family` 정의에 CDN 폰트 이름 사용
- FOUT 감수(폰트 로딩 전에는 시스템 sans-serif로 잠깐 렌더 후 교체) — 사용자 경험 상 짧아서 무시 가능

---

## R6. 반응형 브레이크포인트와 nav 스위칭

**Decision**: 순수 CSS `@media` 쿼리로 결정:
- **모바일**: `(max-width: 640px)` → BottomTabBar만 노출, TopNav는 `display: none`
- **데스크톱**: `(min-width: 1024px)` → TopNav만 노출, BottomTabBar는 `display: none`
- **중간 구간 (641~1023px)**: 데스크톱 규칙 적용 (TopNav 노출). 태블릿 전용 프로파일 없음(Assumptions).

**Rationale**:
- CSS 미디어 쿼리 = 초기 렌더 시점부터 정확한 nav만 보임. JS 기반 감지(useEffect)면 hydration 전에 잘못된 nav가 잠깐 깜빡임.
- 두 브레이크포인트가 겹치지 않게 640/1024로 클리어 컷.

**Alternatives considered**:
- **JS `window.matchMedia` 기반**: hydration mismatch, 초기 깜빡임 발생.
- **container query**: 브라우저 지원 좋아졌지만 아직 폴리필 필요한 케이스가 있음. 여기서는 뷰포트 기반이 더 정확.

**Impact**:
- `components/AppShell.js`가 두 nav를 항상 렌더하고 CSS로 감춤
- `app/globals.css`에 미디어 쿼리 규칙

---

## R7. Study 모드에서 하단 탭 바 숨김

**Decision**: `AppShell.js` (Client Component)가 `usePathname()`으로 현재 경로를 읽어 `/sets/*/study` 또는 `/public-sets/*/study`에 매칭되면 `<BottomTabBar>`를 렌더하지 않는다. 데스크톱의 TopNav는 study 모드에서도 그대로 유지(데스크톱은 화면이 넓어 방해되지 않음).

**Rationale**:
- Clarify Q3 결정: 학습 몰입.
- 경로 매칭 하나로 판단 → 라우트 그룹 폴더 재배치보다 훨씬 얇음(Constitution I).
- 모바일에서만 숨기는 이유: 데스크톱에서 상단 nav를 숨겨도 얻는 몰입감이 작음(어차피 화면이 넓음).

**Alternatives considered**:
- **라우트 그룹 `(app)` / `(study)` 분리**: 폴더 이동 필요, 파일 경로가 URL과 불일치해서 초심자 혼란.
- **각 study 페이지가 layout에서 `<style>` 오버라이드**: 이질적인 트릭.

**Impact**:
- `components/AppShell.js`의 `usePathname()` 로직
- CSS에서 study 경로용 별도 클래스 필요 없음(컴포넌트 조건 렌더로 해결)

---

## R8. 회원가입 성공 배너의 전달 방식

**Decision**: `signUp` Server Action이 성공 시 `redirect('/login?signedUp=1')`. `LoginPage`가 `searchParams.signedUp`이 `'1'`이면 상단에 배너 렌더. 쿠키·세션에는 아무 상태도 저장하지 않음. 사용자가 다른 링크로 이동하면 `signedUp` 쿼리가 URL에서 사라져 자연스럽게 배너가 소멸.

**Rationale**:
- Clarify Q1 결정(Option B).
- 쿼리스트링만으로 상태 전달 — 서버 세션/쿠키 오염 없음(Constitution I, "trust internal code").
- 뒤로 가기·새로고침으로도 배너가 정확히 재현됨.

**Alternatives considered**:
- **세션 쿠키에 플래시 메시지 저장**: 서버 상태 추가, 복잡도 증가.
- **URL fragment(#signedUp)**: 서버가 못 읽어서 렌더에 못 씀.

**Impact**:
- `app/(auth)/signup/page.js`의 성공 리다이렉트 경로
- `app/(auth)/login/page.js`의 `searchParams` 읽기 + 배너 컴포넌트

---

## R9. 아이콘 처리

**Decision**: 아이콘 라이브러리(lucide-react 등) 도입하지 않고, 필요한 SVG를 `components/icons/` 폴더에 개별 `.js` 파일로 넣거나 컴포넌트 안에 인라인. 이 스펙에서 실제 필요한 아이콘:
- BottomTabBar: 3개 (book, users, user)
- TopNav: 로그아웃 아이콘(선택)
- 각 페이지 액션: 편집(pencil), 삭제(trash), 추가(plus)

**Rationale**:
- Constitution I: ~20줄로 해결 가능하면 의존성 추가 금지. inline SVG는 각 5~10줄.
- 트리셰이킹된 lucide-react라도 초기 번들에 아이콘당 ~200바이트가 붙음. 우리는 총 <10개.
- 아이콘 스타일(stroke width, color)을 CSS 변수로 통제하기 쉬움.

**Alternatives considered**:
- **lucide-react**: 인기 있지만 이 앱에는 과잉.
- **폰트 아이콘(FontAwesome)**: 추가 CSS/폰트 로드, 배민 톤과 결이 안 맞음.

**Impact**:
- `components/icons/` 폴더 신설
- 각 아이콘은 `export default function IconName({ size=24, color='currentColor' })` 형태의 얇은 컴포넌트

---

## R10. 마이그레이션 안전 실행 순서

**Decision**: `supabase/schema.sql`이 다음 순서로 idempotent하게 동작하도록 재작성:
1. 테이블 생성(`create table if not exists`) — 그대로 유지
2. `alter table profiles add column if not exists is_approved boolean not null default false`
3. **백필**: `update public.profiles set is_approved = true where is_approved = false;` — 이 스펙 배포 시점에 이미 존재하는 모든 프로필을 승인 상태로 만든다. 이후 `default false`가 신규 가입자에게만 적용됨. **재실행 안전**(모두 이미 true라면 no-op).
4. `drop policy ... create policy ...`로 8개 정책 재정의(승인 조건 포함)

**Rationale**:
- FR-109 요구(기존 계정은 승인됨으로 시작).
- 재실행 안전성(사용자가 여러 번 붙여넣고 Run해도 데이터 손상 없음).
- 순서가 어긋나면 신규 가입자도 백필 대상이 될 수 있으므로, 백필은 **컬럼 추가 직후 · 정책 갱신 이전** 위치.

**Alternatives considered**:
- **별도 migration 파일 분리**(001_add_approval.sql 등): Spec 001의 결정(단일 schema.sql 파일)과 충돌. 사용자 요구 명시.
- **애플리케이션 부팅 시 초기화 코드**: Vercel serverless에는 부팅 개념이 없음. 부적합.

**Impact**:
- `supabase/schema.sql` 재작성
- README·quickstart에 "이번 배포 시 SQL Editor에서 이 파일을 다시 실행" 안내
