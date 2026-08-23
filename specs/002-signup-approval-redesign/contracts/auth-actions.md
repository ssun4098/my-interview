# Contract: Auth Server Actions (delta for 002)

파일: `lib/auth-actions.js`. 이 문서는 spec 001의 계약에서 **변경되는 부분만** 서술한다.

---

## `signUp(formData)` — 변경 요약

**변경 전 (spec 001)**: 성공 시 auth.users + profile 생성 → 자동 signInWithPassword → `redirect('/sets')`.

**변경 후 (spec 002)**:
- profile 생성 시 `is_approved`를 명시하지 않아 DB default(`false`)가 적용된다.
- **자동 로그인 단계를 제거한다.** `signInWithPassword` 호출하지 않음.
- 마지막에 `redirect('/login?signedUp=1')`.

**Behavior**:
1. username 정규화 · isValid 검사 · password 최소 길이 검사 (동일).
2. `admin.auth.admin.createUser({ email, password, email_confirm: true })` (동일).
3. `admin.from('profiles').insert({ id: userId, username })` — `is_approved` 미명시 → default `false`.
4. profile insert 실패 시 `admin.auth.admin.deleteUser(userId)`로 롤백 (동일).
5. `redirect('/login?signedUp=1')`.

**Success**: `/login?signedUp=1` 리다이렉트 (로그인 페이지가 배너 렌더).

**Error contract**: 동일 (`{ error: string }`).

**Spec mapping**: FR-102, FR-103.

---

## `signIn(formData)` — 변경 요약

**변경 전**: `signInWithPassword` 성공 시 즉시 `redirect(next ?? '/sets')`.

**변경 후**: `signInWithPassword` 성공 후 **profile.is_approved 조회를 추가**. `false`면 세션 무효화 후 승인 대기 오류 반환.

**Behavior**:
1. username 정규화 · 필수 필드 검사 (동일).
2. `supabase.auth.signInWithPassword({ email, password })` 호출.
3. 실패 시 `{ error: '아이디 또는 비밀번호가 올바르지 않습니다.' }` (동일, FR-107 우선순위 유지).
4. 성공 시:
   a. `supabase.from('profiles').select('is_approved').eq('id', user.id).single()` 조회.
   b. `is_approved === false`이거나 profile이 없는 경우:
      - `supabase.auth.signOut()` — 방금 발급된 세션 즉시 무효화.
      - `{ error: '아직 승인되지 않은 계정입니다. 관리자에게 문의해 주세요.' }` 반환.
   c. `is_approved === true`인 경우: `redirect(next ?? '/sets')`.

**Success**: 승인된 사용자만 리다이렉트.

**Error contract**: 두 종류 오류 메시지:
- 자격 증명 오류: 통합 메시지 (FR-107 우선).
- 승인 대기: 별도 명시 메시지 (FR-104).

**Spec mapping**: FR-104, FR-105, FR-107.

---

## `signOut()` — 변경 없음

Spec 001 계약 그대로.

---

## 미들웨어 (`middleware.js`) — 변경 요약

Server Action은 아니지만 승인 흐름의 핵심.

**변경 전**: `auth.getUser()`로 세션 확인 → 없으면 `/login`으로 리다이렉트.

**변경 후**: 인증된 사용자에 대해 **profile.is_approved 추가 조회**.

**Behavior**:
1. Supabase SSR 클라이언트 생성 후 `auth.getUser()`.
2. 세션 없음 + 보호 경로 → `/login?next=…`로 리다이렉트 (동일).
3. 세션 있음:
   a. 요청 경로가 `/login`, `/signup`이면 그대로 진행(공개).
   b. 그 외 경로에 대해 `profile.is_approved` 조회.
   c. `is_approved === false` 또는 profile 없음 → `signOut()` 후 `/login?revoked=1`로 리다이렉트.
   d. `is_approved === true` → `NextResponse.next()`로 통과.

**Rationale**:
- FR-106 요구("다음 서버 상호작용부터 차단")를 미들웨어가 가장 자연스럽게 만족.
- `/login`을 예외로 두는 이유: 미승인 사용자가 리다이렉트 후 로그인 페이지 자체는 볼 수 있어야 오류 안내를 표시 가능.

**Spec mapping**: FR-106, FR-108(관리자 UI 부재 → 미들웨어가 유일한 강제 지점).

---

## 로그인 페이지 배너 (`app/(auth)/login/page.js`) — 변경 요약

**변경 요약**: `searchParams.signedUp === '1'`이면 상단에 성공 배너 렌더. `searchParams.revoked === '1'`이면 상단에 승인 취소 안내 배너 렌더.

**Behavior**:
- `signedUp=1`: "가입이 완료되었습니다. 관리자 승인 후 로그인할 수 있습니다." — mint tint 배경.
- `revoked=1`: "세션이 만료되었거나 계정이 비활성화되었습니다. 다시 로그인해 주세요." — neutral 톤. 승인 취소를 명시적으로 노출하지 않아 프라이버시 유지.
- 다음 페이지 이동 시 쿼리스트링이 사라져 배너 자연 소멸.

**Spec mapping**: FR-103 (signedUp), FR-106 (revoked).
