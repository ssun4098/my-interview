# Contracts

이 스펙은 spec 001의 계약을 **증분 갱신**한다. 완전히 새 계약을 만들지 않고, 다음 세 문서로 변경점만 정리:

1. **[auth-actions.md](./auth-actions.md)** — `signUp`은 자동 로그인이 아니라 `/login?signedUp=1`로 리다이렉트. `signIn`은 로그인 후 `is_approved` 검사 추가.
2. **[data-access.md](./data-access.md)** — RLS 정책이 승인 조건을 포함하므로 승인 대기 사용자에게 모든 Supabase 쿼리가 빈 결과·오류로 나타난다. `lib/profile.js` 신규 조회 헬퍼.
3. **[design-system.md](./design-system.md)** — [DESIGN.md](../../../DESIGN.md)의 토큰을 CSS 커스텀 프로퍼티로 옮기는 매핑 계약. 컴포넌트 API의 최소 사양.

DB 스키마 정본은 여전히 [`supabase/schema.sql`](../../../supabase/schema.sql).
