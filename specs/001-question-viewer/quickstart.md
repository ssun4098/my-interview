# Quickstart: 001-question-viewer

이 문서는 이 스펙의 산출물을 개발자가 실제로 돌려보기 위한 최소 절차이다. Next.js를 처음 다루는 사용자를 대상으로 함.

---

## 사전 준비

- Node 20 LTS 설치 (`node --version`으로 확인)
- Supabase 계정과 새 프로젝트 하나 (무료 티어 OK)
- Vercel 계정 (배포 확인용, 로컬만 돌리면 생략 가능)

---

## 1. Supabase 프로젝트 설정

1. https://supabase.com 대시보드 → 새 프로젝트 생성.
2. **Settings → API**에서 다음 세 값을 복사해 둔다:
   - Project URL
   - `anon` `public` key
   - `service_role` `secret` key (⚠️ 절대 브라우저에 노출 금지)
3. **Authentication → Providers → Email**에서 다음 확인:
   - Email provider: **활성** (기본).
   - **Confirm email**: **OFF** (합성 이메일이라 이메일 확인 링크가 도달하지 않음).
   - Password minimum length: **8**.
4. **SQL Editor → New query**에 리포지토리의 [`supabase/schema.sql`](../../supabase/schema.sql) 전체를 붙여넣고 **Run**.
   - 결과: `profiles`, `question_sets`, `questions` 세 테이블이 생성되고 RLS 정책이 적용됨.
   - 재실행 안전: 스크립트는 `if not exists` / `drop policy ... create policy` 패턴으로 idempotent.

---

## 2. 로컬 환경 준비

리포지토리 루트에서:

```bash
# 1) 의존성 설치
npm install

# 2) env 파일 준비
cp .env.example .env.local
# .env.local 을 열어 다음 세 값을 채운다:
#   NEXT_PUBLIC_SUPABASE_URL=<Project URL>
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
#   SUPABASE_SERVICE_ROLE_KEY=<service role key>

# 3) 개발 서버
npm run dev
```

브라우저에서 http://localhost:3000 열기.

---

## 3. 검증 시나리오 (수동)

각 유저 스토리를 아래 순서로 확인. 자동 테스트가 없으므로 이 절차가 검증의 정본이다.

### 3.1 회원가입 · 로그인 · 로그아웃 (US2)

1. `/signup`에서 `alice` / `password12` 로 가입 → `/sets`로 자동 이동, Nav에 `alice` 표시.
2. 로그아웃 → `/login`으로 이동, Nav에서 사용자명 사라짐.
3. 다시 `/login`에서 잘못된 비밀번호 → "아이디 또는 비밀번호가 올바르지 않습니다" (필드 특정 없음, FR-005).
4. 올바른 비밀번호 → `/sets`.
5. `/signup`에서 `alice` 로 재가입 시도 → "이미 사용 중인 아이디" 오류.

### 3.2 문제집 · 문제 CRUD (US3)

1. `/sets/new`에서 "OSI 7계층" 제목, 공개 체크박스 ON → 저장.
2. 상세 페이지에서 문제 3개 추가 (제목/내용/키워드; 키워드는 콤마 또는 엔터로 여러 개 입력).
3. 그중 한 문제 편집 → 저장. `created_at` 순서(목록 정렬)가 유지되는지 확인.
4. 다른 문제 삭제 → 문제집에서 즉시 사라짐.
5. 문제집 편집 → 제목/공개 여부 토글.
6. 문제집 삭제 → `/sets` 목록에서 사라짐.

### 3.3 순서대로 조회 · 두 가지 모드 (US1) 🎯 MVP

- 시드 데이터: US3에서 만든 문제 최소 3개.
- `/sets/:id/study?mode=study&i=0`:
  - 첫 문제: 제목·내용·키워드 모두 처음부터 표시 (FR-017).
  - 다음 → 두 번째 문제, 여전히 모두 표시.
  - 마지막 문제에서 다음 → "학습 완료했습니다" 문구만 (액션 버튼 없음, FR-020b).
- `/sets/:id/study?mode=memorize&i=0`:
  - 첫 문제: 제목만 표시, "내용 보기" 버튼 (FR-018).
  - 버튼 클릭 → 내용/키워드 표시.
  - 다음 문제로 이동 → 다시 제목만 (FR-021).
  - 이전 버튼으로 첫 문제로 돌아가면 다시 제목만 상태로 초기화 (Clarify Q1).
- 첫 문제에서 "이전" 버튼은 비활성 (FR-020a).
- 로그아웃 상태에서 `/sets/:id/study?...` 직접 접근 → `/login?next=...` (FR-007).

### 3.4 공개 문제집 둘러보기 (US4)

- 다른 브라우저(시크릿 창)에서 `bob` / `password12` 가입.
- `bob`으로 `/public-sets`에 접근 → `alice`가 만든 공개 문제집이 소유자 이름과 함께 목록에 표시 (FR-023).
- 열어서 학습 → 자기 문제집과 동일하게 두 모드로 조회 가능.
- 편집/삭제 UI가 노출되지 않는지 확인 (FR-024, FR-010f).
- `alice`가 비공개 문제집을 하나 더 만들고, `bob`이 그 문제집 id로 직접 URL 접근 → 존재하지 않는 것처럼 처리 (FR-013).

---

## 4. Vercel 배포 확인

1. GitHub에 리포지토리 푸시.
2. Vercel → New Project → 이 리포지토리 import (Framework preset: Next.js 자동 감지).
3. Environment Variables에 `.env.example`의 세 변수 등록 (Production · Preview · Development 모두).
4. Deploy.
5. 배포된 URL에서 위 3.1~3.4 스모크 테스트 반복.

---

## 5. 문제 발생 시

- **로그인 후 새로고침하면 로그아웃되는 것처럼 보임**: `middleware.js`의 matcher와 `@supabase/ssr` 쿠키 설정 확인.
- **`profiles insert` 실패**: RLS가 활성화되어 있고, `signUp` Server Action이 실제로 `auth.uid()`를 넘겨받아 실행 중인지 확인.
- **공개 문제집이 목록에 안 뜸**: `question_sets.is_public = true` 인지, RLS SELECT 정책이 재적용되었는지 확인 (`supabase/schema.sql` 재실행).
