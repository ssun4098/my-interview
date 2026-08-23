---

description: "Task list for 003-modern-app-ui (Linear-tone visual refactor + app-quality motion)"
---

# Tasks: 모던 AI 서빙 UI 스타일 재디자인 + 앱 수준 인터랙션

**Input**: Design documents from `/specs/003-modern-app-ui/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md), and a working 002 baseline (approval gate + baemin-style UI already shipping).

**Tests**: **Not included.** Spec did not request tests; Constitution IV keeps them optional. Validation is manual per [quickstart.md](./quickstart.md).

**Organization**: Tasks are grouped by user story (US1 = visual Linear-tone refactor, US2 = motion/interactions). Both are P1. Both can be worked on in parallel by different developers after Phase 2. Solo dev should ship US1 first (visual foundation) then layer US2 on top.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Different file, no dependency on incomplete tasks
- **[Story]**: `[US1]` or `[US2]` on user-story-phase tasks only
- File paths are relative to repo root

## Path Conventions

- Single Next.js web app at repository root.
- New primitives → `components/`, page updates → `app/`.
- 002 data/auth files (`lib/*`, `middleware.js`, `supabase/schema.sql`) are **NOT touched** in this spec.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: This spec introduces **no new dependencies** and **no new toolchain**. Setup is a one-line sanity check.

- [ ] T001 Verify 002 baseline complete: `package.json`, `app/layout.js`, `middleware.js`, `supabase/schema.sql`, `components/Sidebar.js`, `components/AppShell.js`, `components/Button.js`/`TextField.js`/`Chip.js`/`Card.js`, `app/profile/page.js` all exist and app runs (`npm run dev` boots and login/sets pages load). If missing, complete [spec 002 tasks](../002-signup-approval-redesign/tasks.md) first.

**Checkpoint**: 002 running. This spec is a pure UI/motion refactor on top.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The globals.css rewrite and layout.js edit are used by every subsequent US1 and US2 task. Do these first.

- [X] T002 Rewrite `app/globals.css` per [contracts/design-tokens.md](./contracts/design-tokens.md) and [contracts/motion.md](./contracts/motion.md):
      (a) **Delete** `--font-display` variable and any h1/h2/h3 `font-family: var(--font-display)` rules — headings now inherit `--font-body`;
      (b) **Change** `--color-bg-page` from `oklch(0.97 0 286)` to `oklch(0.99 0 286)`;
      (c) **Add** `@keyframes pageIn` (opacity 0→1, translateY 6px→0) and `.page-transition { animation: pageIn 200ms var(--ease-out) both; }`;
      (d) **Add** `@keyframes cardFade` (opacity 0→1) and `.study-card-fade { animation: cardFade 200ms var(--ease-out); }`;
      (e) **Add** `@keyframes pulse` (opacity 1→0.6→1 over 1500ms) and `.skeleton { background: var(--color-bg-subtle); animation: pulse 1500ms ease-in-out infinite; }`;
      (f) **Add** global `button, a[href]` transition rules for background/color/border/transform (120ms), plus `button:active:not(:disabled), a[href]:active { transform: scale(0.98); }`;
      (g) **Add** `:focus-visible` outline rule (2px `var(--color-primary)`, `outline-offset: 2px`) for button/a/input/textarea;
      (h) **Add** `html { scroll-behavior: smooth; }`;
      (i) **Add** global `@media (prefers-reduced-motion: reduce)` block that sets `animation-duration: 0.01ms`, `transition-duration: 0.01ms`, `scroll-behavior: auto` via `!important` on `*/::before/::after`;
      (j) **Add** `input, textarea, select { font-size: 16px; }` (iOS zoom prevention), with a `@media (min-width: 641px)` override to 15px;
      (k) Keep all sidebar/mobile-topbar/app-layout responsive rules from 002 unchanged.
- [X] T003 Update `app/layout.js`: remove the `<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_11-01@1.1/BMHANNAPro.woff.css" />` line entirely. Keep Pretendard link and preconnect. No other changes to layout.js structure.

**Checkpoint**: `npm run dev` still boots. Page transition and skeleton animations are defined in CSS but not yet used. Font stack is Pretendard-only.

---

## Phase 3: User Story 1 - Linear 톤 시각 재정렬 (Priority: P1)

**Goal**: Every visible surface adopts the Linear-tone spec (thin borders, near-monochrome + single mint accent used sparingly, Pretendard-only, compact primitives).

**Independent Test**: Open the running app in a private window at 1440×900 and confirm:
(a) 사이드바 활성 항목이 subtle 회색 배경 + 좌측 2px mint 액센트 바로 표시,
(b) 모든 카드가 그림자 없이 1px 얇은 보더로만 위계 표현,
(c) 주요 버튼이 알약 대신 12px 라운드,
(d) 헤드라인 폰트가 Pretendard(DevTools computed으로 확인),
(e) 브라우저 콘솔의 `document.querySelector('[href*="BMHANNAPro"]')` = `null`.

### Component Primitive Refactor

- [X] T004 [P] [US1] Update `components/Button.js` per [contracts/components.md](./contracts/components.md) §Button: change border-radius from `var(--radius-pill)` to `var(--radius-md)`; reduce heights (sm=36 / md=40 / lg=48); reduce paddings (sm='0 12px' / md='0 16px' / lg='0 20px'); change `variant='primary'` hover to `opacity: 0.9`; change `variant='ghost'` hover bg to `var(--color-bg-subtle)`; change `variant='danger'` to transparent bg + red text + hover bg `--color-red-tint`. Remove per-variant `transition` (global CSS handles it now).
- [X] T005 [P] [US1] Update `components/TextField.js` per [contracts/components.md](./contracts/components.md) §TextField: change resting background from `var(--color-bg-subtle)` to `var(--color-bg-surface)`; remove `useState(focused)` logic — replace with pure CSS `:focus` via inline `style` object combined with global `:focus-visible` outline; height 48 → 40 for input; padding tightened. Border stays 1px `--color-border-2`, focus border stays 1.5px `--color-border-strong`.
- [X] T006 [P] [US1] Update `components/Chip.js` per [contracts/components.md](./contracts/components.md) §Chip: reduce padding to '2px 8px'; reduce font-size to 12px; change `variant='default'` fg from `--color-fg-1` to `--color-fg-2`.
- [X] T007 [P] [US1] Update `components/Card.js` per [contracts/components.md](./contracts/components.md) §Card: change default `shadow` prop from `'var(--shadow-1)'` to `'none'`; change default `border` from `false` to `true` (1px `var(--color-border-1)`). Callers can still override.
- [X] T008 [P] [US1] Update `components/icons/index.js`: change `base.strokeWidth` from `2` to `1.75`. All line-style icons inherit new stroke; filled variants unchanged.

### Sidebar Visual Refinement

- [X] T009 [US1] Update `components/Sidebar.js` per [contracts/components.md](./contracts/components.md) §Sidebar: change nav item active background from `var(--color-primary-tint)` to `var(--color-bg-subtle)`; add a 2px `var(--color-primary)` vertical accent bar (position absolute at left: 0) on active items only; tighten nav item padding to '8px 12px' and margin to '2px 8px'; active text weight 500 → 600; header padding tightened to '12px 12px'; replace footer logout `<button>` with `<Button variant="ghost" size="sm" type="submit" fullWidth>` (import Button from `@/components/Button`).

### Form Components

- [X] T010 [P] [US1] Update `components/KeywordInput.js`: change internal `<input>` style to match new TextField spec (background `--color-bg-surface`, height 40, padding '0 12px', border 1px `--color-border-2`). Keep all comma/enter/dedupe logic unchanged.
- [X] T011 [P] [US1] Update `components/QuestionSetForm.js`: change form gap from `var(--space-5)` to `var(--space-4)`; change error block styling to use `--color-red-tint`/`--color-red` (already matches). Verify SubmitButton uses `<Button variant="mint">` as before; consider switching to `<Button variant="primary">` for Linear tone (less mint), or keep mint if the form is the primary CTA (leave as `mint` — form save is intentional prominent action).
- [X] T012 [P] [US1] Update `components/QuestionForm.js`: same treatment as T011 — gap tightening, error styling verify.

### Study View Visual (motion added in US2 T032)

- [X] T013 [P] [US1] Update `components/StudyView.js` visual only: reduce `<Card>` internal padding to `var(--space-5)`; change "다음" button variant to `primary` (near-black) — reserve `mint` for the completion celebration. Verify the completion `<Card>` uses default new style (border + no shadow). **Do not add the fade animation yet — that's T032.**

### Auth Pages

- [X] T014 [P] [US1] Update `app/(auth)/signup/page.js`: form container `<Card>` uses default new specs (border, no shadow); form gap tightened to `var(--space-4)`; SubmitButton keeps `mint` (signup is a primary CTA); tighten spacing around the "이미 계정이 있나요?" footer link. Verify the whole page fits comfortably on mobile.
- [X] T015 [P] [US1] Update `app/(auth)/login/page.js`: same treatment as T014; the `signedUp` and `revoked` banners use lower-opacity backgrounds — `signedUp` = `--color-primary-tint` (unchanged, banners are the only spot where broad mint tint is OK); `revoked` = `--color-bg-subtle` (unchanged). Verify they read subtly, not shouty.

### List / Detail Pages

- [X] T016 [P] [US1] Update `app/sets/page.js`: verify each set-row `<Card>` uses the new default (border + no shadow). Convert the "+ 새 문제집" button to `<Button variant="primary" size="sm">` (was `mint sm`). Tighten between-row gap from `var(--space-3)` to `var(--space-2)`.
- [X] T017 [P] [US1] Update `app/sets/new/page.js`: container `<Card>` uses new defaults; no other change (QuestionSetForm already refactored in T011).
- [X] T018 [P] [US1] Update `app/sets/[id]/page.js`: title area — h1 uses Pretendard automatically (T002); Chip variant defaults now more muted; action row buttons — study buttons stay `mint`/`primary` as designed; edit/delete buttons switch to `ghost` variant. Each question `<Card>` gets new defaults; edit/delete icon buttons stay `ghost` variant.
- [X] T019 [P] [US1] Update `app/sets/[id]/edit/page.js`: container `<Card>` uses new defaults; no other change.
- [X] T020 [P] [US1] Update `app/sets/[id]/questions/new/page.js`: container `<Card>` uses new defaults; no other change (QuestionForm already refactored in T012).
- [X] T021 [P] [US1] Update `app/sets/[id]/questions/[qid]/edit/page.js`: same as T020.
- [X] T022 [P] [US1] Update `app/sets/[id]/study/page.js`: h1 fontSize adjusted if needed (22 default); verify empty state Card uses new defaults.
- [X] T023 [P] [US1] Update `app/public-sets/page.js`: same treatment as T016 (row Cards, no bg accent).
- [X] T024 [P] [US1] Update `app/public-sets/[id]/page.js`: h1 spacing, action buttons — "학습 모드로 열기" `primary`, "암기 모드로 열기" `ghost`, "목록으로" `ghost` (less mint).
- [X] T025 [P] [US1] Update `app/public-sets/[id]/study/page.js`: same treatment as T022.
- [X] T026 [P] [US1] Update `app/profile/page.js`: container `<Card>` uses new defaults; logout button already uses `<Button variant="ghost">` (unchanged).

**Checkpoint**: Every screen visually reads as Linear-tone. mint is limited to (a) sidebar active accent bar, (b) TextField focus outline (global rule from T002), (c) select "mint" variant buttons (signup/save CTAs). Manual sweep per quickstart §2.1 passes.

---

## Phase 4: User Story 2 - 앱 수준의 자연스러운 인터랙션 (Priority: P1)

**Goal**: Add the page-transition wrapper, per-route skeleton loaders, and the study-card fade animation. Global hover/active/focus feedback and prefers-reduced-motion handling are already in place from T002.

**Independent Test**: Follow quickstart §2.2 — page transitions visible (200ms fade+slide), skeletons appear during data load, study cards fade between questions, `prefers-reduced-motion: reduce` in DevTools disables all motion.

### Page Transition Wrapper

- [X] T027 [US2] Create `app/template.js` — Server Component (no `'use client'` needed). Body:
      ```jsx
      export default function Template({ children }) {
        return <div className="page-transition">{children}</div>;
      }
      ```
      The `.page-transition` class is already defined in globals.css (T002). Verify by navigating between routes and seeing the 200ms fade+6px slide on every route change.

### Skeleton Loader

- [X] T028 [P] [US2] Create `components/Skeleton.js` per [contracts/components.md](./contracts/components.md) §Skeleton: functional component accepting `width`, `height`, `radius` (default 4) props; renders a single `<div className="skeleton" style={{ width, height, borderRadius: radius }} />`. `.skeleton` class already defined in globals.css (T002).
- [X] T029 [P] [US2] Create `app/sets/loading.js`: uses `<Skeleton>` + `<Card>` to approximate the sets list page structure. Skeleton: title (120×28), then 3 `<Card>`s each containing a title skeleton (60% width × 16px) + subtitle (30% × 12px).
- [X] T030 [P] [US2] Create `app/sets/[id]/loading.js`: skeleton for title (200×28) + badge (60×22 pill) + button row (3 buttons × 40×36) + 3 question `<Card>` skeletons.
- [X] T031 [P] [US2] Create `app/public-sets/loading.js`: similar to T029 structure (title + 3 rows).
- [X] T032 [P] [US2] Create `app/public-sets/[id]/loading.js`: title + by-line + 2 action button skeletons.

### Study Card Fade

- [X] T033 [US2] Update `components/StudyView.js`: wrap the question card in `<div key={question.id} className="study-card-fade">...</div>` so that changing `question.id` (i.e., moving to next/prev) causes React to remount the wrapper and re-trigger the CSS keyframe defined in globals.css (T002). Ensure the wrapper is inside the outer StudyView container so the "다음/이전" controls DON'T re-animate on each nav.

**Checkpoint**: Motion is live. All animations respect `prefers-reduced-motion` because the global media query from T002 covers them.

---

## Phase 5: Polish & Cross-Cutting

- [X] T034 [P] Run `npm run lint`; fix any warnings.
- [X] T035 [P] Run `npm run build`; verify success and note "First Load JS shared by all" (should be ≤ 200KB, likely lower than 002 due to Hanna CDN removal).
- [X] T036 [P] Constitution sweep: `git grep -nE "\.tsx?$"` returns nothing; no `tsconfig.json`; no `typescript`/`@types/*` in package.json; no `server.js`; no `output: 'standalone'` in next.config.js; no `framer-motion` or other animation library in package.json.
- [X] T037 [P] Update `README.md`: (a) folder tree adds `app/template.js`, `app/sets/loading.js`, `app/sets/[id]/loading.js`, `app/public-sets/loading.js`, `app/public-sets/[id]/loading.js`, `components/Skeleton.js`; (b) "기술 스택" section notes the Linear-tone direction and Pretendard-only stack; (c) remove the "인증 방식에 대한 짧은 노트" section's mention of Hanna if any (there isn't, so this is a no-op check).
- [ ] T038 Manual walkthrough per [quickstart.md](./quickstart.md) §2.1 (US1 Linear visual) and §2.2 (US2 motion). Test both desktop (1440×900) and mobile (375×667). Test `prefers-reduced-motion: reduce` toggle in DevTools → Rendering.
- [ ] T039 Deploy to Vercel; re-verify quickstart §2 on the deployed URL; check Network tab that no BM Hanna font is loaded.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: baseline check only.
- **Phase 2 (Foundational)**: **BLOCKS both US1 and US2.** T002 → T003 can be parallel (different files).
- **Phase 3 (US1)**: depends on Phase 2. Internal ordering: **primitives cluster first (T004~T008 parallel), then Sidebar (T009), then form components (T010~T012 parallel), then page updates (T013~T026 parallel)**.
- **Phase 4 (US2)**: depends on Phase 2. Independent of US1 (motion targets globals.css classes, not visual details).
- **Phase 5 (Polish)**: after both stories.

### Parallel Opportunities

Phase 2:
```text
T002 · T003 (parallel — different files)
```

Phase 3 first wave (after Phase 2):
```text
T004 · T005 · T006 · T007 · T008 (five primitives + icons, all parallel)
```

Phase 3 second wave (after primitives):
```text
T009 (Sidebar depends on Button primitive from T004 for footer logout button)
T010 · T011 · T012 (parallel — form components consume new primitives)
```

Phase 3 third wave (after primitives):
```text
T013 · T014 · T015 · T016 · T017 · T018 · T019 · T020 · T021 · T022 · T023 · T024 · T025 · T026
(all page files, fully parallel — different files, all consuming already-updated primitives)
```

Phase 4:
```text
T027 (template.js) alone
T028 (Skeleton.js) alone, can also run parallel with T027
T029 · T030 · T031 · T032 (loading.js × 4, parallel, depend on T028)
T033 (StudyView, depends on globals.css keyframe from T002)
```

Phase 5:
```text
T034 · T035 · T036 · T037 (all parallel)
T038 · T039 (manual, sequential at end)
```

---

## Implementation Strategy

### Ship US1 First (recommended for solo dev)

1. Phase 1: T001 sanity check.
2. Phase 2: T002 + T003.
3. Phase 3: primitives → sidebar → forms → pages.
4. **STOP · VALIDATE**: quickstart §2.1 passes. App looks Linear-tone; animations are unchanged from 002 (no page transitions, no skeletons yet).
5. Phase 4: T027 → T028 → loading.js batch → T033.
6. Phase 5: polish + deploy.

### Parallel Team Strategy

- Dev A: US1 (~23 tasks) — mostly visual, easy to divide by file.
- Dev B: US2 (~7 tasks) — motion additions. Can start once Phase 2 done.

### Ordering Note

Phase 2 must complete before either story to avoid double-styling. T002 is the largest single task (globals.css rewrite), plan ~30–45 min for that one.

---

## Notes

- `[P]` = different file, no dependency on incomplete work.
- `[USn]` label maps each user-story task back to spec.md for traceability.
- Manual validation ([quickstart.md](./quickstart.md)) is the test suite.
- **Zero new dependencies** allowed by this spec. Do NOT install `framer-motion`, `tailwindcss`, `radix-ui`, or any UI/motion library (Constitution I; also SC-309 500KB budget).
- Do NOT introduce `.ts`/`.tsx`/`@types/*`/`tsconfig.json`, `server.js`, or `output: 'standalone'` at any point.
- Do NOT touch `middleware.js`, `lib/auth-actions.js`, `lib/profile.js`, `supabase/schema.sql`, or any 002 auth/RLS logic. This spec is UI/motion only.
- The `--font-display` removal (T002 (a)) may cause a brief FOUT on first load in dev — normal; production build has caching.
