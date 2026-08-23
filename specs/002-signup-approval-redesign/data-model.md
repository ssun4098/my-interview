# Data Model: 회원가입 승인제 도입 및 UI 전면 재디자인

**Feature**: 002-signup-approval-redesign · **Date**: 2026-08-22

이 스펙의 데이터 모델 변경은 **`profiles` 테이블에 `is_approved` 컬럼 한 개 추가** + **RLS 정책 8개 재정의**로 요약된다. 나머지 스키마는 spec 001 그대로 유지.

물리 정의는 [`supabase/schema.sql`](../../supabase/schema.sql). 이 문서는 변경점의 개념·이유·정책 요약.

---

## Changed Table: `public.profiles`

| Column | Type | Change | Notes |
|--------|------|--------|-------|
| `id` | `uuid` PK | — | 변경 없음 |
| `username` | `text` UNIQUE | — | 변경 없음 |
| **`is_approved`** | `boolean NOT NULL DEFAULT false` | **신규** | 소유자가 앱 밖(SQL/대시보드)에서 `true`로 변경할 때까지 사용자는 로그인·데이터 접근 불가 |
| `created_at` | `timestamptz` | — | 변경 없음 |

**Invariants**:
- 신규 회원가입 시 `is_approved`는 반드시 `false`(default)로 시작 — `signUp` Server Action은 이 값을 명시적으로 설정하지 않음.
- 기존 프로필(이 스펙 이전에 만들어진)은 마이그레이션 시점에 `true`로 백필 (FR-109).
- 소유자만 값을 바꿀 수 있고, 그것도 앱 UI가 아닌 Supabase 대시보드/SQL로 (FR-108).

**Lifecycle**:
- **INSERT**: 회원가입 시 자동, 값은 default `false`.
- **UPDATE**: 앱 코드에서 이 컬럼을 변경하지 않는다. 오직 소유자가 대시보드에서.
- **DELETE**: profile 삭제 시 `auth.users` 삭제로 cascade — 기존과 동일.

---

## Unchanged Tables

- `public.question_sets`: 컬럼 변경 없음. **RLS 정책만 갱신**(아래).
- `public.questions`: 컬럼 변경 없음. **RLS 정책만 갱신**(아래).

---

## RLS Policy Changes

이 스펙의 핵심 보안 규칙 변경. 두 도메인 테이블의 모든 정책에 "요청자가 승인된 프로필임"을 AND 조건으로 추가한다. `profiles` 자신의 정책은 그대로 유지(미들웨어와 프로필 페이지가 자기 profile을 읽어야 하므로).

### 공통 헬퍼(가상 표현, 실제 SQL은 inline)

```sql
-- 이 표현은 각 정책의 USING/WITH CHECK 앞에 AND로 붙는다:
exists (
  select 1 from public.profiles p
  where p.id = auth.uid()
    and p.is_approved = true
)
```

### `question_sets` 정책

| Policy | 변경 | 요약 |
|--------|------|------|
| `question_sets_select` | 승인 조건 추가 | 승인된 사용자만 자기 것 또는 공개 셋을 SELECT |
| `question_sets_insert` | 승인 조건 추가 | 승인된 사용자만 자기 owner_id로 INSERT |
| `question_sets_update` | 승인 조건 추가 | 승인된 소유자만 UPDATE |
| `question_sets_delete` | 승인 조건 추가 | 승인된 소유자만 DELETE |

### `questions` 정책

| Policy | 변경 | 요약 |
|--------|------|------|
| `questions_select` | 승인 조건 추가 | 승인된 사용자만 접근 가능한 셋 안의 문제 SELECT |
| `questions_insert` | 승인 조건 추가 | 승인된 소유자만 INSERT |
| `questions_update` | 승인 조건 추가 | 승인된 소유자만 UPDATE |
| `questions_delete` | 승인 조건 추가 | 승인된 소유자만 DELETE |

### `profiles` 정책 (변경 없음)

- `profiles_select_authenticated`: 인증된 사용자면 누구나 SELECT (승인 상태 무관 — 그렇지 않으면 미들웨어와 프로필 페이지가 자기 profile을 못 읽어 순환).
- `profiles_insert_self`: 자신의 id로만 INSERT.
- `profiles_update_self`: 자신의 id로만 UPDATE. (이 스펙 범위에서 앱은 profile을 UPDATE하지 않지만, 정책은 정합성 유지 목적으로 남겨둔다.)

**보안 노트**: profile SELECT를 승인 여부 무관하게 허용하는 것은 승인 대기 사용자에게 "자기 승인 상태가 뭔지" 알 권리를 주기 위함. 위험이 낮다(승인되지 않은 사용자는 어차피 도메인 데이터에는 접근 불가).

---

## Migration Order (idempotent)

`supabase/schema.sql`을 사용자가 다시 붙여넣기·Run 할 때 아래 순서를 지켜야 한다:

1. **테이블 CREATE**(기존 그대로, `if not exists`).
2. **컬럼 ADD**: `alter table public.profiles add column if not exists is_approved boolean not null default false;`
3. **백필**: `update public.profiles set is_approved = true where is_approved = false;`
   - **주의**: 이 문장은 이번 스펙 배포 시점에 이미 존재하는 프로필을 승인 상태로 만드는 목적.
   - 재실행 시에는 모두 이미 승인 상태거나 신규 pending들이 남아있음. 신규 pending을 실수로 승인해버리는 것을 방지하기 위해 **한 번 실행 후에는 이 문장을 주석 처리하는 것을 README에 명시**(대안: `WHERE created_at < now() - interval '1 minute'` 같은 시간 게이트를 걸어 자연스럽게 신규를 제외).

**Decision (R10)**: 시간 게이트 대신 명시적 주석 안내로 간다 — 사용자가 스크립트를 몇 번 실행할지 알 수 없어 방어적으로. `supabase/schema.sql`에 다음 주석 블록:

```sql
-- ONE-TIME BACKFILL BLOCK (run once at initial 002 migration, then comment out or delete)
-- update public.profiles set is_approved = true where is_approved = false;
```

그리고 README와 quickstart가 이 블록을 한 번만 활성화하라고 안내.

4. **정책 재정의**: `drop policy if exists ... create policy ...`로 8개 정책 재작성.

---

## Sample Rows (seeded for testing)

```sql
-- 승인된 소유자 (기본 개발자 계정)
insert into public.profiles (id, username, is_approved)
values ('11111111-1111-1111-1111-111111111111', 'alice', true);

-- 승인 대기 계정 (승인 흐름 테스트용)
insert into public.profiles (id, username, is_approved)
values ('22222222-2222-2222-2222-222222222222', 'bob', false);
-- 승인하려면:
-- update public.profiles set is_approved = true where username = 'bob';
```
