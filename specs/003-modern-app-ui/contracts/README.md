# Contracts

이 스펙의 계약은 UI 표면 위주다. 데이터·인증 계약은 [001](../../001-question-viewer/contracts/)과 [002](../../002-signup-approval-redesign/contracts/)를 그대로 승계한다.

1. **[design-tokens.md](./design-tokens.md)** — 002의 배민 톤 토큰 매핑을 Linear 톤으로 재정렬. 삭제·변경·유지 항목 명시.
2. **[motion.md](./motion.md)** — 페이지 전환·사이드바·마이크로 인터랙션의 지속시간·이징·구현 훅.
3. **[components.md](./components.md)** — Button/TextField/Chip/Card/Sidebar/Skeleton의 새 시각 사양.

DB 스키마 정본은 여전히 [`supabase/schema.sql`](../../../supabase/schema.sql)이며 이 스펙에서 수정하지 않는다.
