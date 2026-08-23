# Contract: Data Access via Supabase Client

앱 코드에서 Supabase JS 클라이언트로 직접 호출하는 데이터 오퍼레이션 목록. 각 오퍼레이션의 권한은 RLS가 강제하므로, 여기서는 "정상 흐름에서 필요한 호출과 예상 결과"만 정의한다.

호출 컨텍스트:
- **Server**: Server Component / Server Action에서 `lib/supabase-server.js`의 클라이언트로 호출.
- **Client**: (거의 없음) 사용자 상호작용이 필요한 곳은 대체로 Server Action 경유. Client 사용 예외는 명시.

---

## 문제집 (question_sets)

### Q1. 내 문제집 목록 조회

- **When**: `/sets` 페이지 (Server Component).
- **SQL 개념**: `select id, title, is_public, created_at from question_sets where owner_id = auth.uid() order by created_at desc;`
- **JS**:
  ```js
  const { data, error } = await supabase
    .from('question_sets')
    .select('id, title, is_public, created_at')
    .order('created_at', { ascending: false });
  ```
  (owner_id 필터는 RLS가 자동으로 걸어줌.)
- **Success**: `data`는 배열. 빈 배열 가능.
- **Error**: RLS로 실패할 일 없음(자기 소유만 조회). 네트워크 오류만 처리.
- **Spec**: FR-008, FR-023 아님(내 목록).

### Q2. 공개 문제집 목록 조회

- **When**: `/public-sets` 페이지 (Server Component).
- **JS**:
  ```js
  const { data } = await supabase
    .from('question_sets')
    .select('id, title, created_at, owner:profiles ( username )')
    .eq('is_public', true)
    .order('created_at', { ascending: false });
  ```
- **Success**: 각 항목에 `owner.username` 포함 (FR-023: 소유자 식별 정보 표시).
- **Spec**: FR-014, FR-023.

### Q3. 문제집 단건 조회 (본인 것 또는 공개)

- **When**: `/sets/:id`, `/public-sets/:id`, 학습 화면.
- **JS**:
  ```js
  const { data, error } = await supabase
    .from('question_sets')
    .select('id, title, is_public, owner_id, owner:profiles ( username )')
    .eq('id', id)
    .single();
  ```
- **RLS**: 소유자이거나 `is_public = true`가 아니면 `data === null` (또는 not found). 이 경우 앱에서 404 렌더 (비공개 존재 유출 방지 · Edge Case).
- **Spec**: FR-013, FR-014, FR-015.

### Q4. 문제집 생성

- **When**: `/sets/new` 폼 제출 (Server Action).
- **JS**:
  ```js
  const { data, error } = await supabase
    .from('question_sets')
    .insert({ title, is_public, owner_id: user.id })
    .select('id')
    .single();
  ```
- **Success**: 새 id 반환 → `redirect(`/sets/${data.id}`)`.
- **Error**: `title` 길이 위반(CHECK) 등은 서버 에러 반환 → 폼 아래에 표시.
- **Spec**: FR-008.

### Q5. 문제집 수정 (제목/공개여부)

- **When**: `/sets/:id/edit` 폼 제출 (Server Action).
- **JS**:
  ```js
  await supabase
    .from('question_sets')
    .update({ title, is_public })
    .eq('id', id);
  ```
- **RLS**: 비소유자의 UPDATE는 0행 매칭으로 조용히 실패 → 앱은 이를 명시적으로 오류 처리 (Q3 조회에서 이미 소유권 확인 후 진입).
- **Spec**: FR-008a.

### Q6. 문제집 삭제

- **When**: `/sets/:id`의 "삭제" 버튼 (Server Action, 확인 UI 후).
- **JS**:
  ```js
  await supabase.from('question_sets').delete().eq('id', id);
  redirect('/sets');
  ```
- **Behavior**: FK cascade로 questions도 함께 사라짐.
- **Spec**: FR-008b.

---

## 문제 (questions)

### Q7. 문제집의 문제 목록 (순서대로)

- **When**: `/sets/:id`, `/public-sets/:id`, 학습 화면 초기 로드.
- **JS**:
  ```js
  const { data } = await supabase
    .from('questions')
    .select('id, title, content, keywords, created_at')
    .eq('question_set_id', setId)
    .order('created_at', { ascending: true });
  ```
- **RLS**: 문제집 접근 권한이 없으면 빈 배열.
- **Spec**: FR-012 (순서), FR-011 (소속).

### Q8. 문제 생성

- **When**: `/sets/:id/questions/new` 폼 (Server Action).
- **Input 처리**: 클라이언트 `KeywordInput`이 이미 정규화한 배열을 전송.
- **JS**:
  ```js
  await supabase
    .from('questions')
    .insert({ question_set_id: setId, title, content, keywords });
  ```
- **Spec**: FR-010, FR-010a/b/c.

### Q9. 문제 수정

- **When**: `/sets/:id/questions/:qid/edit` 폼 (Server Action).
- **JS**:
  ```js
  await supabase
    .from('questions')
    .update({ title, content, keywords })  // created_at 절대 건드리지 않음
    .eq('id', qid);
  ```
- **Spec**: FR-010d (정렬 기준인 created_at 유지).

### Q10. 문제 삭제

- **When**: 문제집 상세의 각 문제 옆 "삭제" 버튼 (Server Action).
- **JS**:
  ```js
  await supabase.from('questions').delete().eq('id', qid);
  ```
- **Spec**: FR-010e.

---

## 프로필 (profiles)

### Q11. 회원가입 후 프로필 삽입

- **When**: `signUp` Server Action의 마지막 단계 (auth.users 생성 후).
- **JS**:
  ```js
  await supabase.from('profiles').insert({ id: user.id, username });
  ```
- **Error**: `23505` UNIQUE 위반 → `{ error: '이미 사용 중인 아이디입니다.' }`. 이 시점에는 `auth.users`가 이미 생성되어 있으므로 관리 SDK로 해당 사용자 삭제 시도 후 재시도 유도 (또는 사용자에게 다시 로그인 요청).

---

## 오류 매핑 원칙

| Supabase 오류 상황 | 사용자 노출 |
|--------------------|-------------|
| RLS 위반으로 0행 반환 | 화면에 "존재하지 않는 문제집입니다" (비공개 유출 방지) |
| UNIQUE 위반 (23505) | 폼 하단에 필드별 안내 ("이미 사용 중인 아이디") |
| CHECK 위반 (23514) | 폼 하단에 필드별 안내 ("제목은 1~200자여야 합니다") |
| 네트워크/서버 오류 | 페이지 상단 배너 "잠시 후 다시 시도해 주세요" |
| Auth 실패 | 통합 메시지 (FR-005) |
