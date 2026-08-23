---

description: "Task list for 002-signup-approval-redesign (Baemin-style redesign + signup approval workflow)"
---

# Tasks: 회원가입 승인제 도입 및 UI 전면 재디자인

**Input**: Design documents from `/specs/002-signup-approval-redesign/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md), and a working baseline from [spec 001](../001-question-viewer/) (project already scaffolded via `npm install`, `supabase/schema.sql` v1 applied).

**Tests**: **Not included.** Spec did not request tests; Constitution IV keeps them optional. Validation is manual via [quickstart.md](./quickstart.md).

**Organization**: Tasks are grouped by user story (US1 → US2, both P1). Both stories can be worked on in parallel by different developers after the foundational phase; a single developer should ship US1 first (smaller, security-critical) before starting US2 (large surface area).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Different file, no dependency on incomplete tasks
- **[Story]**: `[US1]` or `[US2]` on user-story-phase tasks only
- File paths are relative to repo root

## Path Conventions

- Single Next.js web app (per plan.md).
- New primitives → `components/`, new helpers → `lib/`, new pages under `app/`.
- Schema: `supabase/schema.sql` (single file, idempotent).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: This spec introduces **no new dependencies** and **no new toolchain**. Setup is a one-line sanity check that the spec 001 baseline is present.

- [ ] T001 Verify spec 001 baseline: `package.json`, `app/layout.js`, `middleware.js`, `supabase/schema.sql`, `lib/supabase-server.js`, `lib/auth-actions.js`, and `components/Nav.js` all exist at their expected paths; `node_modules/` populated (`npm install` completed). If missing, complete [spec 001 tasks](../001-question-viewer/tasks.md) first.

**Checkpoint**: Baseline confirmed. `npm run dev` still boots.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Migration + shared helper that both US1 and US2 depend on.

**⚠️ CRITICAL**: T003 is a user-executed step in the Supabase dashboard. It **must be run once** to add the `is_approved` column and backfill existing profiles; skipping it means all existing users get locked out on the first middleware pass after US1 ships.

- [ ] T002 Rewrite `supabase/schema.sql` per [data-model.md](./data-model.md) migration order (R10):
      (a) keep existing `create table` blocks;
      (b) add `alter table public.profiles add column if not exists is_approved boolean not null default false;` right after the profiles CREATE;
      (c) add a `-- ONE-TIME BACKFILL BLOCK` comment with a commented-out `update public.profiles set is_approved = true where is_approved = false;`;
      (d) update all 8 policies on `question_sets` and `questions` to add the AND clause `and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_approved = true)` inside `USING` and `WITH CHECK`;
      (e) leave `profiles` policies unchanged.
- [ ] T003 User action: in Supabase SQL Editor, temporarily uncomment the `update public.profiles set is_approved = true where is_approved = false;` line in `supabase/schema.sql`, paste the full file, click **Run**. Verify in Table Editor that (a) `profiles.is_approved` column exists and (b) all existing rows have `is_approved = true`. Then re-comment the update line and re-save the file so subsequent runs do not auto-approve new pending users.
- [ ] T004 [P] Create `lib/profile.js` exporting `getCurrentProfile(supabase)` per [contracts/data-access.md](./contracts/data-access.md): read `auth.getUser()`, then `select('id, username, is_approved').eq('id', user.id).maybeSingle()`. Return `{ id, username, is_approved } | null`.

**Checkpoint**: DB schema updated, backfill applied, shared helper ready. US1 and US2 can now proceed in parallel.

---

## Phase 3: User Story 1 - 회원가입 승인제 (Priority: P1)

**Goal**: New sign-ups land in `pending` state; login and data access are blocked until the owner flips `is_approved = true` in the DB. Existing sessions of newly-unapproved users are cut off from the next request.

**Independent Test**: Sign up as `charlie` → land on `/login?signedUp=1` with mint banner → attempt login → "아직 승인되지 않은 계정입니다" error → SQL Editor: `update profiles set is_approved = true where username = 'charlie';` → retry login → land on `/sets`. Then set back to `false` → next any-page click redirects to `/login?revoked=1` with neutral banner.

### Implementation for User Story 1

- [ ] T005 [US1] Update `lib/auth-actions.js`: (a) in `signUp`, delete the trailing `signInWithPassword` call and change the final `redirect('/sets')` to `redirect('/login?signedUp=1')` — `profile.insert` no longer needs `is_approved` field since DB default (`false`) applies; (b) in `signIn`, after `auth.signInWithPassword` succeeds, `select('is_approved')` from `profiles` for `user.id` — if `false` or null, call `supabase.auth.signOut()` and return `{ error: '아직 승인되지 않은 계정입니다. 관리자에게 문의해 주세요.' }`; only redirect on `is_approved === true`. Keep the credential-error branch and generic error message unchanged (FR-107 priority).
- [ ] T006 [US1] Update `middleware.js`: after the existing `auth.getUser()` check, if there **is** a user AND the pathname is not `/login` or `/signup`, use `lib/profile.js` (or an inline select) to fetch `is_approved`; if `false` or null, `await supabase.auth.signOut()` on the response and return `NextResponse.redirect(new URL('/login?revoked=1', request.url))`. Keep the existing unauth redirect logic untouched. Confirm matcher still bypasses `_next/*` and static assets.
- [ ] T007 [US1] Update `app/(auth)/login/page.js`: read `searchParams.signedUp` and `searchParams.revoked` on the server side and pass into the client component (or use a client wrapper). Render one of two banners above the form:
      - `signedUp === '1'` → mint-tinted banner "가입이 완료되었습니다. 관리자 승인 후 로그인할 수 있습니다."
      - `revoked === '1'` → neutral banner "세션이 만료되었거나 계정이 비활성화되었습니다. 다시 로그인해 주세요."
      Banners are pure JSX — no cookies, no session state; they disappear as soon as the user navigates. Keep the existing form logic intact (styling refresh happens in US2 as T027).

**Checkpoint**: All six US1 acceptance scenarios pass end-to-end. This story is shippable independently of US2 — the app looks unchanged visually, but the approval gate is fully enforced.

---

## Phase 4: User Story 2 - 배민 디자인 시스템 기반 UI 전면 재설계 (Priority: P1)

**Goal**: Every screen adopts the DESIGN.md token stack (colors, typography, spacing, rounds, elevation, animation). Responsive shell: TopNav on desktop, 3-tab BottomTabBar on mobile. Footer never renders. Study/memorize routes hide the bottom tab bar for immersion.

**Independent Test**: In desktop viewport (1440×900) TopNav visible, no bottom bar, footer nowhere; in mobile viewport (375×667) BottomTabBar with 3 tabs (내 문제집 · 공개 문제집 · 프로필), no top nav, no footer; enter a study route and confirm bottom bar disappears; check every page for token-based colors/typography/rounds; keyword chips render as pills with ✕.

### Design Foundation (do this cluster first — later tasks depend on it)

- [ ] T008 [P] [US2] Rewrite `app/globals.css`: define all CSS custom properties per [contracts/design-system.md](./contracts/design-system.md) §1 in `:root` (colors, font families, spacing, rounded, elevation, animation). Add the responsive rules per §2 (`@media (max-width: 640px)` and `@media (min-width: 641px)`). Reset (`* { box-sizing: border-box }`), body defaults (`background: var(--color-bg-page); color: var(--color-fg-1); font-family: var(--font-body)`). Delete all component-specific class rules from the old file (`.nav`, `.form`, `.study`, `.set-list`, etc.) — they will be reimplemented per-component now that tokens exist.
- [ ] T009 [US2] Update `app/layout.js`: (a) add `<link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />` and `<link rel="preconnect" href="https://cdn.jsdelivr.net" />` in `<head>` via metadata or a direct `<head>` block; add `<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/variable/pretendardvariable.min.css" />` and `<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/fonts-archive/BMHANNAPro/subsets/BMHANNAPro-dynamic-subset.css" />`; (b) add `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />` (for safe-area support, FR-212); (c) replace `<Nav />` with `<AppShell>{children}</AppShell>` — remove `<main>` wrapper (AppShell owns layout).

### Icon Assets

- [ ] T010 [P] [US2] Create `components/icons/BookIcon.js`, `UsersIcon.js`, `UserIcon.js`, `LogOutIcon.js`, `EditIcon.js`, `TrashIcon.js`, `PlusIcon.js`, `ChevronRightIcon.js`. Each is a tiny functional component: `export default function BookIcon({ size = 24, color = 'currentColor', filled = false }) { return <svg ...>...</svg>; }`. Use stroke-based line icons (stroke width 2) for unfilled variants; filled variants for active bottom-tab state (BookIcon, UsersIcon, UserIcon). Reference: match Lucide Icons look (per DESIGN.md substitution note).

### Component Primitives

- [ ] T011 [P] [US2] Create `components/Button.js`: accept `variant='primary'|'mint'|'ghost'|'danger'` (default `primary`), `size='sm'|'md'|'lg'` (default `md`), `fullWidth`, `disabled`, and any other button props. Render `<button>` with computed inline styles (or class names + inline for variant colors) referencing CSS vars per [contracts/design-system.md](./contracts/design-system.md) §3. All variants are pill-shaped (`border-radius: var(--radius-pill)`). Include an `<a>`-styled variant if needed via `as="link"` prop for `<Link>` interop (or export a sibling `<LinkButton>`).
- [ ] T012 [P] [US2] Create `components/TextField.js`: 48px height, 12px radius, `--color-bg-subtle` background, 1px `--color-border-2` border, 1.5px `--color-border-strong` border on focus (via `:focus-within` on wrapper or `:focus` on input). Accept standard input props plus `label`, `error` optional. Renders `<label>` wrapping the input.
- [ ] T013 [P] [US2] Create `components/Chip.js`: pill-shaped, 24-28px height, `--color-bg-subtle` background, `--color-fg-1` text, 13px 500 font. Accepts `onRemove` prop — when provided, renders a trailing ✕ button (14px, `--color-fg-3`) that calls the callback. Also accept `variant='default'|'mint'|'danger'` for tint variations.
- [ ] T014 [P] [US2] Create `components/Card.js`: `<div>` with `background: var(--color-bg-surface)`, `border-radius: var(--radius-lg)`, `padding: var(--space-5)`, optional `--shadow-2`. Accept `as` prop to render as `<article>` or other tag when semantic. Pass through `className`, `children`, `onClick`.

### Responsive Shell

- [ ] T015 [P] [US2] Create `components/TopNav.js` as a Server Component: reads current profile via `lib/profile.js`; renders header bar (64px tall, `--color-bg-surface` bg, bottom border 1px `--color-border-1`) with left = app title link "my-interview", center = three `<Link>`s (내 문제집 → `/sets`, 공개 문제집 → `/public-sets`, 프로필 → `/profile`), right = username text. CSS `display: none` in mobile media query.
- [ ] T016 [P] [US2] Create `components/BottomTabBar.js` as a Client Component (needs `usePathname()` for active state): render `<nav>` fixed to viewport bottom with `padding-bottom: env(safe-area-inset-bottom)`, height 64px + safe area, 3 tab items in a `flex` row. Each tab: icon (24px) + label (11px, weight 500 inactive / 700 active). Active tab uses filled icon + `--color-fg-1` label; inactive uses stroke icon + `--color-fg-3`. Tabs: 내 문제집 (`/sets`, BookIcon), 공개 문제집 (`/public-sets`, UsersIcon), 프로필 (`/profile`, UserIcon). CSS `display: none` in desktop media query.
- [ ] T017 [US2] Create `components/AppShell.js` as a Client Component: reads `usePathname()`; the shell layout is `<div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>` containing `<TopNav />`, then `<main style={{ flex: 1, maxWidth: 720, margin: '0 auto', padding: 'var(--space-4)', paddingBottom: 'calc(64px + env(safe-area-inset-bottom) + var(--space-4))' }}>{children}</main>`, then conditionally `<BottomTabBar />`. Suppress `<BottomTabBar />` when `pathname` matches `/^\/(sets|public-sets)\/[^\/]+\/study(\/|$|\?)/` (study routes, R7); also suppress both nav elements when pathname starts with `/login` or `/signup`. Note: because TopNav is a Server Component and AppShell is a Client Component, TopNav must be passed as a prop from `layout.js` (which is a Server Component) instead of imported inside AppShell — refactor accordingly.
- [ ] T018 [US2] Delete `components/Nav.js`. Verify no other file imports it (`git grep 'from.*components/Nav'` returns nothing after this task).

### Profile Page (new route)

- [ ] T019 [US2] Create `app/profile/page.js` as a Server Component: use `lib/profile.js` to load current profile → render `<Card>` with H2 title "프로필", body "아이디: {username}", and a `<form action={signOut}><Button variant="ghost" size="md" type="submit">로그아웃</Button></form>`. If profile is null (edge case), redirect to `/login`.

### Retrofit Existing Components

- [ ] T020 [P] [US2] Update `components/KeywordInput.js`: replace the inline `<span className="chip">` markup with `<Chip label={chip} onRemove={() => removeChip(i)} />`. Keep all comma/enter/dedupe logic unchanged.
- [ ] T021 [P] [US2] Update `components/QuestionSetForm.js`: replace raw `<input>` with `<TextField>`, replace submit button with `<Button variant="mint" type="submit">`. Keep `useFormState` logic. Wrap error message in appropriate styled block (inline red text using `--color-red`).
- [ ] T022 [P] [US2] Update `components/QuestionForm.js`: same treatment — `<TextField>` for title, `<textarea>` in a similarly-styled wrapper, `<KeywordInput />` unchanged (now uses `<Chip>`), `<Button variant="mint">` submit.
- [ ] T023 [P] [US2] Update `components/StudyView.js`: wrap the question card in `<Card>` (padding, radius, surface). Replace the two `<button>` elements with `<Button variant="ghost" size="md">이전</Button>` and `<Button variant="mint" size="md">다음</Button>`. Replace "내용 보기" button with `<Button variant="ghost" size="sm">`. Replace the completion screen with `<Card>` centered "학습 완료했습니다" text.

### Retrofit Existing Pages (styling-only pass)

- [ ] T024 [P] [US2] Update `app/(auth)/signup/page.js`: replace raw `<input>` with `<TextField>`, submit `<button>` with `<Button variant="mint" fullWidth>`. Wrap the whole form in `<Card>` centered on the viewport (max-width 400px).
- [ ] T025 [P] [US2] Update `app/(auth)/login/page.js`: same TextField/Button/Card treatment (form structure preserved from T007). The `signedUp` and `revoked` banners from T007 should be styled: `signedUp` uses mint tint background (`--color-primary-tint`, `--color-mint-700` text if available or `--color-fg-1`); `revoked` uses neutral bg (`--color-bg-subtle`, `--color-fg-2` text). Both are `<div>` blocks above the form with 12px radius and 12px padding.
- [ ] T026 [P] [US2] Update `app/sets/page.js`: wrap the list in a stack, replace each `<li>` with `<Card as="li">` containing title + badge + date. Convert "+ 새 문제집" `<Link>` to `<Button variant="mint">`.
- [ ] T027 [P] [US2] Update `app/sets/new/page.js`: no structural change (QuestionSetForm already uses primitives via T021).
- [ ] T028 [P] [US2] Update `app/sets/[id]/page.js`: title area uses H1 + badge, action row uses `<Button>` variants (mint for study modes, ghost for edit, danger for delete). Each question row wrapped in `<Card>`. Owner-only "수정/삭제" buttons use ghost/danger variants.
- [ ] T029 [P] [US2] Update `app/sets/[id]/edit/page.js`: no structural change (QuestionSetForm reused via T021).
- [ ] T030 [P] [US2] Update `app/sets/[id]/questions/new/page.js`: no structural change (QuestionForm reused via T022).
- [ ] T031 [P] [US2] Update `app/sets/[id]/questions/[qid]/edit/page.js`: no structural change (QuestionForm reused via T022).
- [ ] T032 [P] [US2] Update `app/sets/[id]/study/page.js`: no structural change — StudyView reused via T023 handles the card look. Just verify the H1 title uses `--font-display`.
- [ ] T033 [P] [US2] Update `app/public-sets/page.js`: same Card list treatment as T026.
- [ ] T034 [P] [US2] Update `app/public-sets/[id]/page.js`: title area, action buttons, meta text all use new primitives + tokens.
- [ ] T035 [P] [US2] Update `app/public-sets/[id]/study/page.js`: same as T032 — verify title uses display font, StudyView already updated.

**Checkpoint**: All pages adopt the new design system. Manual walkthrough per quickstart.md §2.2 passes. Both viewports render correctly.

---

## Phase 5: Polish & Cross-Cutting

- [ ] T036 [P] Run `npm run lint`; fix any warnings.
- [ ] T037 [P] Run `npm run build`; confirm success with no TypeScript prompt, no missing-config errors. Note the "First Load JS shared by all" size — should be ≤ 200KB.
- [ ] T038 [P] Constitution sweep: `git grep -nE "\.tsx?$"` returns nothing; no `tsconfig.json`; no `typescript`/`@types/*` in package.json; no `server.js`; no `output: 'standalone'` in next.config.js.
- [ ] T039 [P] Update `README.md`: (a) folder tree adds `components/AppShell.js`, `TopNav.js`, `BottomTabBar.js`, `Button.js`, `TextField.js`, `Chip.js`, `Card.js`, `icons/*.js`, `app/profile/`, `lib/profile.js`; removes `components/Nav.js`; (b) "Supabase 준비" section notes that this deploy needs the ONE-TIME backfill line uncommented once, then re-commented; (c) new "승인 상태 변경 방법" subsection with the SQL one-liner.
- [ ] T040 Manual walkthrough per [quickstart.md](./quickstart.md) §2.1 (US1) and §2.2 (US2). Both desktop and mobile viewports. Log any deviations before Vercel deploy.
- [ ] T041 Deploy to Vercel; re-verify quickstart §2 on the deployed URL, and quickstart §3 (SC-108 bundle size check).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: baseline check only, no changes.
- **Phase 2 (Foundational)**: **BLOCKS all user stories.** T002 → T003 sequential (code first, then user runs it); T004 can start after T002.
- **Phase 3 (US1)**: depends on Phase 2. Fully independent of US2 — the app looks unchanged but the approval gate is enforced.
- **Phase 4 (US2)**: depends on Phase 2 (needs `lib/profile.js` for TopNav/BottomTabBar user display). Independent of US1 — can run in parallel by a different developer.
- **Phase 5 (Polish)**: after both stories.

### Within Each Phase

- Any two tasks marked `[P]` touch different files and can proceed in parallel.
- Within Phase 4, respect internal ordering:
  1. **Foundation cluster first** (T008 tokens, T009 layout, T010 icons, T011-T014 primitives) — can go in parallel.
  2. **Shell next** (T015-T017) — depends on primitives and icons.
  3. **Delete old** (T018) — after AppShell wired in T017.
  4. **Retrofit** (T019 profile page, T020-T023 components, T024-T035 pages) — many parallelizable, some ordering (e.g., T020 KeywordInput must complete before T022 QuestionForm expects the new Chip variant to work).

### Parallel Opportunities

Phase 2 (after T003):
```text
T004 alone
```

Phase 3 (US1):
```text
T005 → T006 → T007  (sequential — each depends on the previous in behavior chain)
```

Phase 4 (US2) — first wave (parallel):
```text
T008 · T010 · T011 · T012 · T013 · T014
```

Phase 4 second wave (after primitives + tokens):
```text
T015 · T016 (parallel), then T017 (sequential — depends on both)
T009 can run in parallel with T015/T016 (touches app/layout.js only)
```

Phase 4 third wave (after AppShell):
```text
T018 (delete Nav.js, sequential — no [P])
T019 (profile page, parallel with retrofit tasks)
T020 · T021 · T022 · T023 (parallel — different component files)
T024 · T025 · T026 · T027 · T028 · T029 · T030 · T031 · T032 · T033 · T034 · T035 (all parallel — different page files)
```

Phase 5:
```text
T036 · T037 · T038 · T039 (all parallel)
T040 · T041 (manual, at the end)
```

---

## Implementation Strategy

### Ship US1 First (recommended for solo dev)

1. Phase 1: T001 sanity check.
2. Phase 2: T002-T004 (schema + backfill + profile helper).
3. Phase 3: T005-T007 (US1 done).
4. **STOP · VALIDATE**: Walk through quickstart §2.1. Approval gate is live, app still looks like spec 001. Optional intermediate deploy.
5. Phase 4: US2 in the ordering above.
6. Phase 5: polish + deploy.

### Parallel Team Strategy

- Dev A: US1 (Phase 3, small — 3 tasks).
- Dev B: US2 (Phase 4, large — 28 tasks). Start with the foundation cluster while Dev A ships US1.
- Merge after both stories complete, then Phase 5 together.

### Migration Safety Checklist

Before T003 in production:
- Backup existing profiles (screenshot or CSV export from Supabase dashboard).
- Confirm the count of existing profiles matches what you expect (all should be your own dev accounts unless you already opened signup).
- Run the backfill on a dev Supabase project first if you have one.

---

## Notes

- `[P]` = different file, no dependency on incomplete work.
- `[USn]` label maps each user-story task back to spec.md for traceability.
- Manual validation ([quickstart.md](./quickstart.md)) is the test suite.
- Do NOT introduce `.ts`, `.tsx`, `@types/*`, TypeScript, or a UI/icon/CSS-in-JS library at any point (Constitution I, II).
- Do NOT add `server.js`, `output: 'standalone'`, or any custom Node server (Constitution III).
- The `-- ONE-TIME BACKFILL BLOCK` comment in `supabase/schema.sql` (T002) MUST be re-commented after T003 completes; otherwise every subsequent re-run of the SQL file will auto-approve any pending users.
