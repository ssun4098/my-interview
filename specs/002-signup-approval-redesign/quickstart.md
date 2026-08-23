# Quickstart: 002-signup-approval-redesign

이 스펙을 로컬·프로덕션에서 검증하는 최소 절차. spec 001의 [quickstart.md](../001-question-viewer/quickstart.md)를 이미 완료했다는 전제.

---

## 0. Supabase 마이그레이션 (첫 배포 시 1회)

Supabase 대시보드 → **SQL Editor → New query**에 갱신된 [`supabase/schema.sql`](../../supabase/schema.sql) 전체를 붙여넣고 **Run**.

**★ 중요**: `schema.sql` 안에 다음 주석 블록이 있다:

```sql
-- ONE-TIME BACKFILL BLOCK (uncomment ONCE for the 002 migration, then comment back)
-- update public.profiles set is_approved = true where is_approved = false;
```

이번 배포에 한해 이 한 줄의 주석(`-- update ...`)을 풀고 실행해서 기존 사용자를 승인 상태로 백필한다. 실행 후 다시 주석 처리해야 이후 재실행 시 신규 pending 사용자가 실수로 승인되지 않는다.

**Table Editor에서 확인**:
- `profiles` 테이블에 `is_approved` 컬럼(boolean, default false)이 있음.
- 기존 사용자의 값이 `true`.

---

## 1. 로컬 개발 재시작

의존성·env 변경 없음. 이번 배포에 코드 변경 반영을 위해 서버를 재시작:

```bash
# Ctrl+C로 dev 서버 종료 후
npm run dev
```

---

## 2. 검증 시나리오 (수동)

### 2.1 US1 — 회원가입 승인제

1. 시크릿 창에서 `/signup`으로 이동 → `charlie` / 강한 비밀번호로 가입 → `/login`으로 이동하고 상단에 mint tint 배너 "가입이 완료되었습니다. 관리자 승인 후 로그인할 수 있습니다." 확인.
2. 같은 자격 증명으로 로그인 시도 → "아직 승인되지 않은 계정입니다. 관리자에게 문의해 주세요." 오류 확인. 세션 발급되지 않음(개발자도구 Application → Cookies에서 `sb-*` 세션 쿠키 확인).
3. 잘못된 비밀번호로 로그인 시도 → "아이디 또는 비밀번호가 올바르지 않습니다." (자격 증명 오류 우선, FR-107).
4. Supabase SQL Editor에서 `update public.profiles set is_approved = true where username = 'charlie';` 실행.
5. 다시 로그인 → 정상 진입, `/sets` 도착.
6. Supabase에서 다시 `false`로 되돌림. 브라우저에서 어떤 링크 클릭이든 하면 → `/login?revoked=1`로 리다이렉트, 상단에 "세션이 만료되었거나 계정이 비활성화되었습니다. 다시 로그인해 주세요." 배너.

### 2.2 US2 — UI 재디자인

**데스크톱 뷰포트 (예: 1440×900)**:
1. 로그인 → 상단에 TopNav (앱 타이틀·3링크·사용자 이름) 노출. 하단 탭 바 없음.
2. 어느 페이지에서도 `<footer>` 없음. 개발자도구 콘솔에 `document.querySelector('footer')` → `null` 확인.
3. Card 컴포넌트(문제집 목록 각 행, 학습 화면 문제 카드)가 라운드된 흰 표면 + 옅은 그림자로 렌더.
4. 주요 버튼("새 문제집", "학습 모드로 열기" 등)이 알약 형태.
5. 입력 폼(회원가입·문제집·문제)이 48px 높이의 텍스트 필드 + 포커스 시 검정 보더로 전환.
6. 키워드 입력에서 콤마·엔터로 chip이 분리되고 각 chip이 알약 배지 + ✕ 버튼으로 렌더.

**모바일 뷰포트 (예: 375×667, DevTools의 Responsive 모드)**:
1. 상단 TopNav 대신 하단에 BottomTabBar 3개 탭(내 문제집·공개 문제집·프로필) 노출.
2. 현재 페이지가 반영된 탭이 시각적으로 활성 상태(채움 아이콘 + 굵은 라벨).
3. 프로필 탭 진입 → 아이디 표시 + 로그아웃 버튼 확인.
4. 문제집 학습 모드 진입(`/sets/{id}/study?mode=study&i=0`) → 하단 탭 바가 사라짐 확인(FR-205b, R7). 목록으로 돌아가면 다시 등장.
5. iOS Safari로 실기 확인(가능한 경우): 하단 탭 바가 홈 인디케이터와 겹치지 않음(safe-area).

**폰트 확인**:
- 헤드라인(H1·H2)이 시스템 sans-serif가 아니라 배민 한나체(각지지 않은 손그림 느낌)로 렌더.
- 본문이 Pretendard로 렌더.
- 네트워크를 오프라인으로 하고 하드 리로드 → 폰트 로딩 실패해도 텍스트가 시스템 폰트로 fallback되어 정상 표시(FR-213).

---

## 3. 성능 · 번들 확인 (SC-108)

로컬 프로덕션 빌드:

```bash
npm run build
```

빌드 리포트의 "First Load JS shared by all"이 200KB 이하인지 확인. 브라우저 DevTools의 Network 탭에서 첫 방문 시 로드된 폰트 + CSS + JS 총합(gzipped) ≤ 500KB인지 확인.

---

## 4. 문제 발생 시

- **로그인 성공 후 `/sets`가 아니라 `/login?revoked=1`로 튐**: profile row가 없거나 `is_approved`가 아직 `false`. SQL Editor에서 확인.
- **미들웨어 응답이 느림**: profile 조회 지연. Supabase 리전과 Vercel 리전이 같은지 확인.
- **모바일에서 하단 탭 바가 홈 인디케이터와 겹침**: `env(safe-area-inset-bottom)`이 적용되지 않음. `<meta name="viewport" content="viewport-fit=cover">`가 layout에 있는지 확인.
- **폰트가 시스템 폰트로만 렌더**: 브라우저 개발자도구 Network 탭에서 CDN 요청 실패 여부 확인. CDN URL이 변경되었을 가능성.
- **기존 사용자가 갑자기 로그인 못 함**: `is_approved` 백필 실행 여부 확인. 위의 SQL로 수동 백필.
