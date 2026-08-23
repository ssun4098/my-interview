# Contracts

004 스펙의 계약은 UI 표면 + 모션 위주. 데이터·인증 계약은 [001](../../001-question-viewer/contracts/)과 [002](../../002-signup-approval-redesign/contracts/)를 그대로 승계.

1. **[design-tokens.md](./design-tokens.md)** — 003의 Linear-tone/Airtable-tone 토큰을 완전히 폐기하고 Toss/Telegram/Webtoon 앵커 기반 다크 팔레트로 교체.
2. **[motion.md](./motion.md)** — 스프링 프리셋 · direction 감지 hook · 컴포넌트별 모션 사양. `motion` 라이브러리 사용 컨벤션.
3. **[components.md](./components.md)** — Button/TextField/Chip/Card/Sidebar/Sheet/StudyView의 004 시각 사양 (다크 · 청키 · 스프링).

DB 스키마 정본은 [`supabase/schema.sql`](../../../supabase/schema.sql)이며 이 스펙에서 수정하지 않는다.
