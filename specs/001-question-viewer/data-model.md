# Data Model: 면접 준비 문제 조회 (Question Viewer MVP)

**Feature**: 001-question-viewer · **Date**: 2026-08-21

Postgres(Supabase) 스키마. 물리 정의는 [`supabase/schema.sql`](../../supabase/schema.sql)에 있으며, 이 문서는 개념·관계·불변식·RLS 요약이다.

---

## Entity Overview

```text
auth.users (Supabase 관리)
      ▲ 1:1
      │
public.profiles ────── 1:N ─────► public.question_sets ────── 1:N ─────► public.questions
   (username)                      (title, is_public)                     (title, content,
                                                                           keywords[])
```

- Supabase Auth의 `auth.users`가 진짜 인증 주체. 앱은 이를 직접 참조하지 않고 항상 `profiles`를 경유한다.
- `question_sets` : `questions` = 1 : N (문제집 삭제 시 문제도 cascade 삭제).
- `profiles` : `question_sets` = 1 : N (프로필 삭제 시 소유 문제집도 cascade 삭제).
- Keyword는 **엔티티가 아니라** `questions.keywords`의 배열 원소로만 존재한다 (Clarify Q2).

---

## Table: `public.profiles`

앱이 사용자에게 노출하는 신원 정보. 회원가입 시 Server Action이 `auth.users`를 만든 뒤 같은 트랜잭션 흐름에서 이 행을 삽입한다.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | `auth.users.id` FK, `ON DELETE CASCADE` |
| `username` | `text` NOT NULL, UNIQUE | 소문자 정규화(`= lower(username)` CHECK). 형식: `^[a-z0-9._-]{3,32}$` |
| `created_at` | `timestamptz` NOT NULL DEFAULT `now()` | |

**Invariants**:
- `username`은 저장 전에 앱 레이어에서 `trim().toLowerCase()` 처리 후 삽입.
- `username`의 유일성은 UNIQUE 인덱스로 강제 → FR-002 위반 시 Postgres 오류를 회원가입 흐름에서 catch하여 "이미 사용 중인 아이디"로 표시.

**Lifecycle**:
- INSERT: 회원가입 시 Server Action에서 (auth.users insert 성공 → profiles insert). 실패하면 auth.users를 롤백(또는 재시도 안내).
- UPDATE: 이 스펙 범위에서는 username 변경 UI 없음. 향후 확장 여지.
- DELETE: 이 스펙 범위에서 계정 삭제 UI 없음. auth.users 삭제 시 cascade로 함께 사라지도록만 정의.

**RLS**: 로그인한 모든 사용자가 SELECT 가능 (공개 문제집 목록에서 소유자 username을 렌더링해야 하므로). INSERT/UPDATE는 자기 자신의 행만.

---

## Table: `public.question_sets`

문제집. 소유자 1명 · 문제 N개.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | `gen_random_uuid()` 기본값 |
| `owner_id` | `uuid` NOT NULL | `profiles.id` FK, `ON DELETE CASCADE` |
| `title` | `text` NOT NULL | CHECK: 1~200자 |
| `is_public` | `boolean` NOT NULL DEFAULT `false` | 공개 여부 |
| `created_at` | `timestamptz` NOT NULL DEFAULT `now()` | |
| `updated_at` | `timestamptz` NOT NULL DEFAULT `now()` | BEFORE UPDATE 트리거로 자동 갱신 |

**Indexes**:
- `question_sets_owner_id_idx (owner_id)` — "내 문제집 목록" 쿼리.
- `question_sets_public_idx (is_public) WHERE is_public = true` — 공개 목록 부분 인덱스.

**Invariants**:
- 소유자 없는 문제집 불가 (`owner_id NOT NULL`).
- `is_public` 값은 boolean 두 상태만 존재 (Enum이 아니라 boolean으로 충분: Simplicity).

**Lifecycle**:
- INSERT: 로그인 사용자가 자기 자신을 `owner_id`로 하여 생성 (FR-008, RLS로 강제).
- UPDATE: 소유자만 (FR-008a). 제목·공개 여부 변경 가능.
- DELETE: 소유자만 (FR-008b). 소속 questions는 FK cascade로 함께 삭제.

**RLS**:
- SELECT: `authenticated AND (owner_id = auth.uid() OR is_public = true)` — FR-013, FR-014, FR-015.
- INSERT: `authenticated AND owner_id = auth.uid()`.
- UPDATE / DELETE: `owner_id = auth.uid()`.

---

## Table: `public.questions`

문제. 문제집 하나에 소속되며 순서는 `created_at` 오름차순.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | `gen_random_uuid()` 기본값 |
| `question_set_id` | `uuid` NOT NULL | `question_sets.id` FK, `ON DELETE CASCADE` |
| `title` | `text` NOT NULL | CHECK: 1~200자 |
| `content` | `text` NOT NULL | CHECK: 0~5000자 |
| `keywords` | `text[]` NOT NULL DEFAULT `'{}'` | 순서 있는 문자열 배열 |
| `created_at` | `timestamptz` NOT NULL DEFAULT `now()` | 정렬 기준 (FR-012) |
| `updated_at` | `timestamptz` NOT NULL DEFAULT `now()` | BEFORE UPDATE 트리거로 갱신 |

**Indexes**:
- `questions_set_created_idx (question_set_id, created_at)` — 문제집 상세/학습 화면의 순차 조회.

**Invariants**:
- 문제집 없는 문제 불가.
- `keywords`는 앱 레이어에서 저장 전에 정규화 (FR-010a/b/c):
  1. 콤마·엔터로 분리
  2. 각 항목 `trim()`
  3. 빈 문자열 제거
  4. 대소문자·공백 무시 기준 중복 제거 (순서: 첫 등장 위치 유지)
- `created_at`은 UPDATE로 절대 변경하지 않는다 (FR-010d의 "정렬 기준은 유지"). 트리거는 `updated_at`만 건드림.

**Lifecycle**:
- INSERT: 소유 문제집이 있는 사용자만 (RLS).
- UPDATE: 소속 문제집의 소유자만. title/content/keywords 자유롭게 변경.
- DELETE: 소속 문제집의 소유자만.

**RLS**: 소속 문제집의 접근 규칙을 그대로 상속 (parent set이 SELECT 가능하면 questions도 SELECT 가능, 소유자만 write).

---

## Domain-level Rules Not in the Schema

DB 제약으로 표현하지 않고 앱 레이어에서 강제하는 규칙:

| 규칙 | 왜 앱 레이어? | 강제 위치 |
|------|---------------|-----------|
| username: `trim` + `lowercase` 정규화 | DB CHECK는 형식만 검증, 정규화 자체는 애플리케이션 책임 | `lib/username.js` |
| 비밀번호 최소 8자 | Supabase Auth Settings(대시보드)에서 서버 강제 | Supabase 대시보드 |
| 로그인 실패 오류를 필드 특정하지 않고 통합 메시지로 노출 (FR-005) | UX 결정 | `lib/auth-actions.js` 반환값 |
| 키워드 정규화(콤마·엔터 분리, 중복 제거, trim) | 사용자 입력 시 사용성과 결합 | `components/KeywordInput.js` |
| 세션 간 학습 진행 위치 저장 금지 (FR-022) | 아무것도 저장하지 않음 = 아무 저장소도 사용 안 함 | 코드 부재로 강제 |

---

## State Transitions

이 스펙에는 명시적 상태 머신이 없다 (활성/비활성 같은 상태 필드 없음). 유일한 "상태" 개념:

- **문제집 공개 여부** (Boolean): `is_public = false ⇄ true` — 소유자가 자유롭게 토글 (FR-008a). 이력은 저장하지 않는다.
- **학습 세션 진행** (URL param `?i=N`): 서버에 어떤 상태도 저장되지 않음. 페이지 이탈 시 소멸.

---

## Sample Rows (for quickstart seeding)

```sql
-- profile
insert into public.profiles (id, username)
values ('11111111-1111-1111-1111-111111111111', 'alice');

-- question set
insert into public.question_sets (id, owner_id, title, is_public)
values ('22222222-2222-2222-2222-222222222222',
        '11111111-1111-1111-1111-111111111111',
        'OSI 7계층 기본', true);

-- questions
insert into public.questions (question_set_id, title, content, keywords) values
('22222222-2222-2222-2222-222222222222',
 'OSI 7계층 순서',
 '물리 - 데이터링크 - 네트워크 - 전송 - 세션 - 표현 - 응용',
 array['OSI', '7계층', '물리', '전송']),
('22222222-2222-2222-2222-222222222222',
 'TCP와 UDP의 차이',
 'TCP는 연결지향, 신뢰성 있음, 흐름/혼잡 제어. UDP는 비연결지향, 빠름, 신뢰성 없음.',
 array['TCP', 'UDP', '연결지향', '신뢰성']);
```

> 실제 시드는 quickstart.md에서 `auth.users`를 먼저 만든 다음 이 profile을 연결하는 방식으로 안내한다.
