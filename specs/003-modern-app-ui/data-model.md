# Data Model: 모던 AI 서빙 UI 스타일 재디자인 + 앱 수준 인터랙션

**Feature**: 003-modern-app-ui · **Date**: 2026-08-22

**변경 없음.** 이 스펙은 UI 표면만 다루며 도메인 스키마·엔티티·관계는 002의 정의를 그대로 승계한다.

- `public.profiles` (with `is_approved`) — 002 유지
- `public.question_sets` — 002 유지
- `public.questions` — 002 유지
- RLS 정책 8개 — 002 유지

`supabase/schema.sql`은 **수정하지 않는다**.

---

## 새 개념: Motion Profile

스키마는 아니지만, 이 스펙에서 "데이터"에 가까운 명세 대상.

| Motion | Duration | Easing | Trigger |
|--------|----------|--------|---------|
| Page transition | 200ms | ease-out (`cubic-bezier(0.16, 1, 0.3, 1)`) | Route 이동 시 `template.js` 마운트 |
| Study card next/prev | 200ms | ease-out | `question.id` 변경 시 (key 재마운트) |
| Sidebar collapse/expand | 200ms | ease-out | 사용자 클릭 |
| Mobile drawer open/close | 200ms | ease-out | 사용자 클릭·백드롭 탭·라우팅 |
| Button press | 120ms | ease-out | `:active` |
| Button/link hover | 120ms | ease-out | `:hover` |
| Focus ring | (즉시) | — | `:focus-visible` |
| Skeleton pulse | 1500ms 무한 | ease-in-out | `<Skeleton>` 마운트 중 |

`prefers-reduced-motion: reduce` 사용자에게는 위 모든 지속 시간을 0으로 대체.

---

## 새 개념: Design Token Deltas

002의 CSS 커스텀 프로퍼티 세트에서 이 스펙이 **삭제**하는 것:

- `--font-display` (BM 한나체 스택) — 헤드라인이 `--font-body`(Pretendard)를 상속하도록 변경

**변경**하는 것:

- `--color-bg-page`: `oklch(0.97 0 286)` → `oklch(0.99 0 286)` (Linear에 가까운 near-white)

**신규 추가**하는 것:

- `--motion-page-in` (선택) — page transition 지속 시간을 변수화하고 싶다면. 초기엔 keyframe에 직접 값 박아도 무방.

**유지**하는 것: 나머지 모든 토큰 (color · space · radius · shadow · animation).
