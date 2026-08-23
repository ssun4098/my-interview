# Contracts

이 프로젝트는 별도의 REST/GraphQL API를 노출하지 않는다. 모든 도메인 로직은 다음 두 표면 중 하나로 표현된다:

1. **[auth-actions.md](./auth-actions.md)** — Next.js Server Actions (form submission으로 호출되는 signup/login/logout).
2. **[data-access.md](./data-access.md)** — Supabase 클라이언트 호출 (테이블 · RLS를 계약으로 취급).

두 문서 모두 "입력 형태 → 성공 시 결과 → 실패 시 오류" 형식으로 계약을 기술한다. Spec의 각 FR과 어떻게 매핑되는지도 각 섹션에 명시한다.

DB 스키마의 정본은 [`supabase/schema.sql`](../../../supabase/schema.sql)이며, 여기 계약들은 그 스키마 위에서 동작한다.
