# Contract: Auth Server Actions

파일: `lib/auth-actions.js`. 각 Server Action은 `<form action={...}>`에서 직접 호출된다.

---

## `signUp(formData)`

**Purpose**: 새 계정 생성 후 자동 로그인 (FR-001, FR-002, FR-003, FR-004).

**Input** (FormData fields):
- `username` (string) — 사용자가 입력한 아이디. 클라이언트 표시 값 그대로.
- `password` (string) — 최소 8자.

**Behavior**:
1. `username`을 `trim().toLowerCase()`로 정규화.
2. 형식 검증: `/^[a-z0-9._-]{3,32}$/`. 실패 시 `{ error: '사용할 수 없는 아이디 형식입니다.' }` 반환.
3. 비밀번호 길이 8자 미만: `{ error: '비밀번호는 8자 이상이어야 합니다.' }` 반환.
4. Supabase Auth `signUp`을 email = `${normalized}@my-interview.local`, password로 호출.
5. `auth.users` 생성 성공 시 `profiles`에 `id`, `username = normalized` INSERT.
   - UNIQUE 위반(23505) → `{ error: '이미 사용 중인 아이디입니다.' }` 반환하고, 생성된 `auth.users`는 롤백을 시도(admin 삭제) 또는 재로그인 시 재사용 처리.
6. 세션 쿠키가 자동 설정되면 `redirect('/sets')`.

**Success**: 리다이렉트 (Server Action에서 `redirect()`는 예외를 던져 흐름을 종료).

**Error contract**: `{ error: string }` 반환. UI는 이 문자열을 그대로 표시.

**Spec mapping**: FR-001, FR-002, FR-003 (평문 저장 금지는 Supabase Auth가 담당), FR-004.

---

## `signIn(formData)`

**Purpose**: 자격 증명으로 로그인 (FR-004, FR-005).

**Input** (FormData):
- `username` (string)
- `password` (string)

**Behavior**:
1. `username` 정규화 후 email로 합성.
2. Supabase Auth `signInWithPassword({ email, password })` 호출.
3. 오류 발생 시(사유 무관): `{ error: '아이디 또는 비밀번호가 올바르지 않습니다.' }` 반환. **어느 필드가 틀렸는지 특정하지 않는다** (FR-005).
4. 성공 시 `redirect(next ?? '/sets')`. `next`는 미들웨어가 로그인 페이지로 유도할 때 붙여준 쿼리스트링.

**Success**: 리다이렉트.

**Error contract**: `{ error: string }` — 항상 통합 메시지.

**Spec mapping**: FR-004, FR-005.

---

## `signOut()`

**Purpose**: 세션 종료 (FR-006).

**Input**: 없음 (버튼의 `formAction`으로 호출).

**Behavior**:
1. Supabase Auth `signOut()` 호출. 세션 쿠키가 즉시 무효화됨.
2. `redirect('/login')`.

**Success**: 리다이렉트.

**Error contract**: 실패는 정상 흐름에서 발생 가능성이 낮음. 발생 시에도 사용자에게는 이미 로그아웃된 것처럼 보이도록 `/login`으로 이동.

**Spec mapping**: FR-006.

---

## 인증되지 않은 요청 처리 (미들웨어)

`middleware.js`가 담당하며 Server Action이 아니지만 여기 요약:

- 보호된 경로 (`/`, `/sets/*`, `/public-sets/*`) 접근 시 세션이 없으면 `/login?next={pathname}`로 302 리다이렉트 (FR-007).
- 세션이 있으면 요청 계속. 세션 쿠키가 만료 임박 시 refresh.

**Spec mapping**: FR-007, FR-015 (RLS와 이중 방어).
