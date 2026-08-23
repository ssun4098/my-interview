# Data Model: UI 처음부터 재구축 — 모던 감각 + 자연스러운 모바일 모션

**Feature**: 004-fresh-ui-restart · **Date**: 2026-08-23

**변경 없음.** 이 스펙은 UI 표면·모션만 다루며 도메인 스키마·엔티티·관계는 002 정의를 그대로 승계한다.

- `public.profiles` (with `is_approved`) — 002 유지
- `public.question_sets` — 002 유지
- `public.questions` — 002 유지
- RLS 정책 8개 — 002 유지

`supabase/schema.sql`은 **수정하지 않는다**.

---

## Motion Profile (Airtable에는 없었던 004의 "데이터")

스키마는 아니지만 이 스펙에서 데이터에 가까운 명세 대상. `lib/motion.js`에서 정의되고 컴포넌트가 참조.

### 스프링 프리셋

| Preset | stiffness | damping | mass | 용도 |
|---|---|---|---|---|
| `SPRING.page` | 350 | 32 | 0.8 | 모바일 페이지 전환 |
| `SPRING.sheet` | 300 | 30 | 0.9 | 사이드바 드로어 · 하단 시트 |
| `SPRING.micro` | 500 | 30 | 0.5 | 버튼 press · 카드 tap 반응 |

### 라우트 방향

| Direction | Trigger | Motion (모바일) | Motion (데스크톱) |
|---|---|---|---|
| `forward` | pathname 깊이 증가 (예: `/sets` → `/sets/abc`) | 새 화면 오른쪽 슬라이드인, 이전 화면 왼쪽 -30% parallax | fade + 6px 위로 슬라이드 |
| `back` | pathname 깊이 감소, 또는 popstate | 새 화면 왼쪽 -30%에서 슬라이드인, 이전 화면 오른쪽 100% 슬라이드아웃 | fade + 6px 아래로 슬라이드 |
| `sibling` | 같은 깊이 (예: `/sets` → `/public-sets`) | crossfade | crossfade |

### 컴포넌트 모션 매트릭스

| Component | Trigger | Motion |
|---|---|---|
| `PageTransition` | 라우트 변경 | direction-aware (위 표) |
| `Sidebar` mobile drawer | 햄버거 탭 · 백드롭 탭 · 라우팅 | `SPRING.sheet` translateX ±100%, backdrop fade |
| `Sidebar` desktop collapse | 토글 버튼 | `SPRING.sheet` width 240 ↔ 64px |
| `StudyView` card | 다음/이전 | AnimatePresence + direction (다음=오른쪽에서 들어옴) |
| `Button` press | `:active` | `SPRING.micro` scale 0.97 |
| `Sheet` (신규) | 시트 열기/닫기 | `SPRING.sheet` translateY 0/100%, 상단 라운드 20px |
| `Skeleton` | 마운트 | pulse 1500ms 무한 (CSS keyframe) |
| Focus ring | `:focus-visible` | 즉시 (CSS outline) |

### reduced-motion 대체

`prefers-reduced-motion: reduce` 사용자에게는:
- 모든 spring transition의 duration → 0
- direction-aware 슬라이드 → 즉시 표시 (opacity만 유지 가능)
- 카드 fade, drawer transform → 즉시 전환

`motion` 라이브러리의 `useReducedMotion()` hook 또는 `MotionConfig reducedMotion="user"` 사용.

---

## 새 개념: Design Token Deltas (003 → 004)

`app/globals.css`의 CSS 커스텀 프로퍼티가 대폭 재정의된다.

**삭제 없음** (스펙 003의 토큰 이름은 대부분 유지, 값만 다크로 스왑).

**변경 (값 스왑)**: 하단 [contracts/design-tokens.md](./contracts/design-tokens.md) 참조.

**신규**:
- `--radius-sheet: 20px` (모바일 하단 시트 상단 라운드)
- `--spring-page` / `--spring-sheet` / `--spring-micro` (CSS 변수 아님, JS 상수. `lib/motion.js`에 정의)

**폐기**:
- 003의 signature-cream / signature-coral / signature-forest / signature-mint 등 배민-계열 컬러 토큰 (사용 안 함, 하지만 정의는 남겨도 무해)
- 003의 `--font-display` (Airtable에서 이미 제거)
