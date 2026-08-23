# Contract: Data Access (delta for 002)

Spec 001의 [contracts/data-access.md](../../001-question-viewer/contracts/data-access.md)에서 변경된 부분만.

---

## RLS의 승인 조건 추가 — 사용자 코드 영향

`question_sets`와 `questions` 두 테이블의 **모든 정책**에 승인 조건이 AND로 추가된다:

```
승인 대기 사용자의 SELECT → 빈 배열
승인 대기 사용자의 INSERT/UPDATE/DELETE → 0행 매칭, Supabase는 오류 없이 완료
```

앱 코드는 이 사실을 알아야 함:

- **미들웨어(R4)가 이미 승인 대기 사용자를 로그인 페이지로 리다이렉트**하므로, 정상 흐름에서는 승인 대기 사용자가 도메인 페이지에 도달하지 않는다.
- 그럼에도 방어적 코딩 관점에서 각 페이지의 서버 컴포넌트가 조회 결과 `[]`를 자연스럽게 처리하도록 유지(이미 spec 001에서 그러함).
- **INSERT/UPDATE/DELETE 결과가 조용히 실패하는 상황**은 미들웨어가 통과된 상태에서는 발생 불가능. 유일한 예외 시나리오: 승인된 사용자가 서버 액션 실행 중 소유자가 승인을 해제 — 이 경우 다음 요청부터 미들웨어가 걸러냄.

**결론**: 사용자 코드(`lib/set-actions.js`, `lib/question-actions.js`, `lib/queries.js`)는 **변경할 필요가 없다**. RLS와 미들웨어가 새 조건을 조용히 처리.

---

## 신규: `lib/profile.js`

미들웨어와 여러 Server Component에서 반복되는 "현재 사용자의 profile row 조회"를 한 곳으로.

### `getCurrentProfile(supabase)`

- **Input**: 이미 세션 확인된 서버용 Supabase 클라이언트.
- **Return**: `{ id, username, is_approved } | null` (null이면 profile row가 없음 = 데이터 불일치 상황).
- **JS 시그니처**:
  ```js
  export async function getCurrentProfile(supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase
      .from('profiles')
      .select('id, username, is_approved')
      .eq('id', user.id)
      .maybeSingle();
    return data ?? null;
  }
  ```
- **Where used**:
  - `middleware.js`: 승인 검사
  - `components/TopNav.js`, `components/BottomTabBar.js`: 사용자 이름 표시 (선택적으로 프로필 링크 상태 반영)
  - `app/profile/page.js`: 프로필 페이지 본문

**주의**: 미들웨어는 Edge Runtime에서 실행 가능성이 있음. `createServerClient`가 Edge에서도 동작함을 확인한 상태(공식 지원). profile 조회는 Supabase Postgres에 REST 호출 1회 = ~10ms 수준.

---

## 신규: 프로필 페이지 데이터

**Endpoint**: `/profile` (Server Component)

- **Reads**: `getCurrentProfile(supabase)` 하나만.
- **Renders**: username · 계정 생성일(선택) · 로그아웃 버튼(signOut Server Action).
- **Writes**: 없음.

**Spec mapping**: FR-205a.

---

## 오류 매핑 — 변경 없음

Spec 001의 오류 매핑 표는 그대로 유효. 새로 추가되는 오류 상황은 **미들웨어 revoked 리다이렉트**뿐이며, 사용자에게는 로그인 페이지 배너로 통합 노출.
