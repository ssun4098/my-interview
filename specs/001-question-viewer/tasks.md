---

description: "Task list for 001-question-viewer (Next.js + Supabase interview prep MVP)"
---

# Tasks: 면접 준비 문제 조회 (Question Viewer MVP)

**Input**: Design documents from `/specs/001-question-viewer/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: **Not included.** The spec did not request automated tests, and the constitution treats tests as optional (Constitution IV → Development Workflow). Validation is manual per [quickstart.md](./quickstart.md).

**Organization**: Tasks are grouped by user story (US1 → US4 in priority order) so each story can be implemented, tested, and demoed independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on incomplete tasks)
- **[Story]**: `[US1]`–`[US4]` — appears only on user-story-phase tasks; setup/foundational/polish tasks have no story label
- File paths are exact relative paths from the repository root

## Path Conventions

- **Single Next.js web app** at repository root (per plan.md "Project Structure").
- All UI code under `app/` (App Router) and `components/`.
- All non-UI JS helpers under `lib/`.
- Supabase schema at `supabase/schema.sql`.
- Root files: `middleware.js`, `next.config.js`, `jsconfig.json`, `package.json`, `.env.example`, `README.md`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Bootstrap the Next.js project and pin the toolchain in JavaScript-only mode per Constitution II.

- [X] T001 Scaffold Next.js app at repo root: `npx create-next-app@latest . --js --app --eslint --no-tailwind --no-src-dir --import-alias "@/*"`. Confirm no `tsconfig.json`, `.ts`, or `.tsx` files are created (Constitution II)
- [X] T002 [P] Install runtime dependencies: `npm install @supabase/supabase-js @supabase/ssr`
- [X] T003 [P] Verify `jsconfig.json` at project root exposes `"@/*"` path alias; create/patch if `create-next-app` did not
- [X] T004 [P] Create `.env.example` at project root with three placeholders: `NEXT_PUBLIC_SUPABASE_URL=`, `NEXT_PUBLIC_SUPABASE_ANON_KEY=`, `SUPABASE_SERVICE_ROLE_KEY=`
- [X] T005 [P] Verify `.gitignore` at project root includes `.env.local`, `.env*.local`, `.next/`, `node_modules/` (defaults from `create-next-app`); add any missing lines
- [X] T006 [P] Update `README.md` "Vercel에 배포하기" section to add step "0. `supabase/schema.sql`을 Supabase SQL Editor에서 실행"; verify folder tree matches actual scaffolded structure (adds `middleware.js`, `supabase/`, `lib/queries.js`, `lib/username.js`, `lib/auth-actions.js`)

**Checkpoint**: Project builds with `npm run build` (empty pages OK). No TypeScript config exists.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Everything all four user stories share: Supabase clients, session middleware, root layout, Nav, home redirect, DB schema applied. **No user story can proceed until this phase is complete.**

**⚠️ CRITICAL**: T007 and T008 are user-executed steps in the Supabase dashboard (not code). Do not skip them — RLS and auth defaults must be in place before any UI work is meaningful.

- [ ] T007 In Supabase dashboard → SQL Editor → New query, paste the contents of `supabase/schema.sql` and click **Run** (creates `profiles`, `question_sets`, `questions` tables, triggers, and all RLS policies). Verify in Table Editor
- [ ] T008 In Supabase dashboard → Authentication → Providers → Email: disable "Confirm email", set "Password min length" = 8. Save
- [X] T009 [P] Create `lib/supabase-browser.js` exporting `createBrowserSupabase()` using `createBrowserClient` from `@supabase/ssr` and `NEXT_PUBLIC_SUPABASE_*` env vars
- [X] T010 [P] Create `lib/supabase-server.js` exporting `createServerSupabase()` using `createServerClient` from `@supabase/ssr` with Next.js `cookies()` from `next/headers` (for use in Server Components and Server Actions)
- [X] T011 [P] Create `lib/username.js` exporting `normalize(username)` (trim + lowercase), `isValid(username)` (regex `^[a-z0-9._-]{3,32}$`), `toEmail(username)` (append `@my-interview.local`), `fromEmail(email)` (strip suffix)
- [X] T012 Create `middleware.js` at project root: refresh Supabase session cookie via `@supabase/ssr` on every matched request; redirect unauthenticated users from `/`, `/sets/:path*`, `/public-sets/:path*` to `/login?next={pathname}`; explicitly bypass `/login`, `/signup`, `/_next/*`, `/favicon.ico`. Export `config.matcher` accordingly
- [X] T013 [P] Create `lib/auth-actions.js` with `"use server"` at top; implement `signOut()` Server Action only for now (`await supabase.auth.signOut()` then `redirect('/login')`). `signUp` and `signIn` are added later in US2 (T023)
- [X] T014 [P] Create `components/Nav.js` as a Server Component: read session via `createServerSupabase()`; when logged in, render app title + username + `<form action={signOut}>` logout button; when logged out, render app title + `<Link>` to `/login` and `/signup`. Also render a `<Link>` to `/public-sets` (visible in both states when logged in)
- [X] T015 Create `app/layout.js` root layout: `<html lang="ko">`, `<body>` containing `<Nav />` and `{children}` only. **No `<footer>` element** (FR-025). Import `./globals.css`
- [X] T016 [P] Create `app/globals.css` with a minimal reset (`* { box-sizing: border-box }`, `body { margin: 0; font-family: system-ui, sans-serif }`) — or accept the `create-next-app` default and strip out logo/hero styles
- [X] T017 Rewrite `app/page.js` (overwriting the create-next-app placeholder) to a Server Component: read session; if logged in `redirect('/sets')`, else `redirect('/login')`

**Checkpoint**: `npm run dev` boots. Any URL redirects appropriately based on session. Root layout has Nav, no footer. DB schema and Auth defaults are live in Supabase.

---

## Phase 3: User Story 1 - 문제집을 순서대로 학습/암기 (Priority: P1) 🎯 MVP

**Goal**: A logged-in user opens a question set (their own or a public one) and moves through it one question at a time in either 학습 or 암기 mode.

**Independent Test**: Seed one `auth.users` (via Supabase dashboard Auth → Add User) plus one `profiles` row, one `question_sets` row, and three `questions` rows (via SQL Editor — sample rows are in [data-model.md](./data-model.md)). Sign in via the browser using the dashboard-created account (US2 provides the UI; before US2 exists, use the Supabase JS console or complete US2 first). Then visit `/sets/{id}/study?mode=study&i=0` and verify the acceptance scenarios in spec.md US1.

### Implementation for User Story 1

- [X] T018 [P] [US1] Create `lib/queries.js` exporting `getQuestionSetForStudy(supabase, setId)`: fetches the set (id, title, is_public, owner_id) and its questions (id, title, content, keywords, created_at) ordered by `created_at ASC`. Returns `{ set, questions }` or `null` if the set is not accessible under RLS
- [X] T019 [US1] Create `components/StudyView.js` as a Client Component (`"use client"`). Props: `questions` (array), `mode` (`"study"` | `"memorize"`), `initialIndex` (number). Local state: `index`, `revealed` (memorize mode only). Behavior: renders one question card with title always visible; in study mode content + keyword chips are shown from the start; in memorize mode content/keywords hidden until "내용 보기" clicked. "다음" button (disabled visual style on last index → shows completion screen instead of a next question); "이전" button disabled at index 0. On any nav move, `revealed` resets to `false`. Completion screen shows "학습 완료했습니다" text only, **no action buttons** (FR-020b)
- [X] T020 [US1] Create `app/sets/[id]/study/page.js` as a Server Component. Reads `params.id`, `searchParams.mode`, `searchParams.i`. If `mode` is not `"study"` or `"memorize"`, redirect to `/sets/${id}`. Fetches via `getQuestionSetForStudy`. If `null`, render 404. If `questions.length === 0`, render "이 문제집에 아직 문제가 없습니다" without study controls. Otherwise render `<StudyView questions={questions} mode={mode} initialIndex={parsedI} />`
- [X] T021 [P] [US1] Create `app/public-sets/[id]/study/page.js` — identical to T020 but placed under `public-sets`. Same `getQuestionSetForStudy`, same `<StudyView>`. Provides US4's read-only study entry point but is testable now on any `is_public = true` set

**Checkpoint**: With seed data present, both `/sets/:id/study?mode=study&i=0` and `/sets/:id/study?mode=memorize&i=0` work end-to-end. All spec.md US1 acceptance scenarios (1–6) pass. This is the MVP — stop and validate before continuing.

---

## Phase 4: User Story 2 - 아이디/비밀번호 계정 (Priority: P2)

**Goal**: Users can sign up, log in, and log out using only a username and password.

**Independent Test**: Sign up as `alice` / `password12` → auto-redirect to `/sets` with Nav showing `alice`. Log out → back to `/login`. Log in again → back to `/sets`. Sign up again as `alice` → "이미 사용 중인 아이디" error. Log in with wrong password → "아이디 또는 비밀번호가 올바르지 않습니다" (field-generic).

### Implementation for User Story 2

- [X] T022 [US2] Extend `lib/auth-actions.js` (created in T013) with `signUp(formData)` and `signIn(formData)` Server Actions per [contracts/auth-actions.md](./contracts/auth-actions.md). `signUp` validates username format via `lib/username.js`, calls Supabase `auth.signUp` with the synthetic email, then inserts into `profiles` (id = `auth.uid()`, username = normalized); catches Postgres `23505` and returns `{ error: '이미 사용 중인 아이디입니다.' }`. `signIn` calls `auth.signInWithPassword` and on any failure returns the single unified message (FR-005). Both `redirect()` on success
- [X] T023 [P] [US2] Create `app/(auth)/signup/page.js` — Client Component with `<form action={signUp}>`: `username` input, `password` input (type=password), submit button. Uses `useActionState` (or `useFormState`) to display returned `{ error }` beneath the form
- [X] T024 [P] [US2] Create `app/(auth)/login/page.js` — same shape as T023 but form action = `signIn`. Reads `searchParams.next` (defaulting to `/sets`) and passes it into the form as a hidden field; `signIn` reads it back and `redirect()`s accordingly
- [ ] T025 [US2] Manually walk through the middleware (T012) with signed-out state: attempt `/`, `/sets`, `/sets/anything`, `/public-sets`, `/public-sets/anything/study?mode=study&i=0` in a private window; all must land on `/login?next=...`. Attempt `/login` and `/signup`; must render without redirect

**Checkpoint**: Auth flow is complete. US1 is now fully testable via the UI (no dashboard seeding required for the account).

---

## Phase 5: User Story 3 - 문제집/문제 만들기 · 편집 · 삭제 (Priority: P2)

**Goal**: Owners can create question sets, add questions, edit any field, toggle visibility, and delete either.

**Independent Test**: Follow spec.md US3 acceptance scenarios 1–9 end-to-end (create set → add 3 questions → edit one → delete another → toggle visibility → delete set).

### Implementation for User Story 3

- [X] T026 [P] [US3] Create `components/KeywordInput.js` (`"use client"`): controlled chip input. State = `string[]`. Text field accepts characters; on `,` or `Enter` key, splits input, `trim()`s, drops empty, dedupes case-insensitively while preserving first-appearance order, appends to chip list, clears input. Each chip has an ✕ button that removes it. Renders a hidden input `name="keywords"` with value = `JSON.stringify(chips)` for FormData submission
- [X] T027 [P] [US3] Create `components/QuestionSetForm.js` (`"use client"`): fields `title` (text) and `is_public` (checkbox). Accepts optional `initialValues` and `action` prop; wraps a `<form action={action}>`. Displays action-returned `{ error }` above the submit button
- [X] T028 [P] [US3] Create `components/QuestionForm.js` (`"use client"`): fields `title` (text), `content` (textarea, rows=8), keywords via `<KeywordInput initial={initialKeywords} />`. Same action/error contract as T027
- [X] T029 [US3] Create `app/sets/page.js` as a Server Component: fetch "내 문제집 목록" (contracts/data-access.md Q1) — `owner_id` filter applied automatically by RLS. Render a list; each row links to `/sets/{id}` and shows title + 공개/비공개 badge + created_at. Include a "+ 새 문제집" link to `/sets/new`. Empty state: "아직 문제집이 없습니다"
- [X] T030 [P] [US3] Create `app/sets/new/page.js`: renders `<QuestionSetForm action={createSet} />`. `createSet` is a Server Action defined in the same file (or in `lib/set-actions.js`) that inserts a row (contracts Q4) with `owner_id: user.id`, then `redirect(`/sets/${data.id}`)`
- [X] T031 [US3] Create `app/sets/[id]/page.js` as a Server Component: fetch set (Q3) and questions (Q7). If not found → 404. Owner-only controls (visible only when `set.owner_id === user.id`): "제목/공개여부 편집" link → `/sets/{id}/edit`; "문제집 삭제" button (Server Action, confirm-then-delete, Q6); per-question row shows "수정" link and "삭제" button (Server Action, Q10). Also render entry buttons "학습 모드로 열기" → `/sets/{id}/study?mode=study&i=0` and "암기 모드로 열기" → `/sets/{id}/study?mode=memorize&i=0`. "+ 새 문제 추가" link → `/sets/{id}/questions/new`. Non-owner viewing a public set: hide all edit/delete/add controls (FR-024, FR-010f)
- [X] T032 [P] [US3] Create `app/sets/[id]/edit/page.js`: fetches set (Q3), renders `<QuestionSetForm initialValues={set} action={updateSet} />`. `updateSet` calls contracts Q5, then `redirect(`/sets/${id}`)`
- [X] T033 [P] [US3] Create `app/sets/[id]/questions/new/page.js`: renders `<QuestionForm action={createQuestion} />`. Server Action parses `keywords` (JSON string from hidden input) back into an array, applies the FR-010b/c normalization on the server too (defense in depth), then inserts (Q8). `redirect(`/sets/${id}`)`
- [X] T034 [P] [US3] Create `app/sets/[id]/questions/[qid]/edit/page.js`: fetches the target question, renders `<QuestionForm initialValues={question} action={updateQuestion} />`. Server Action updates (Q9) — do not touch `created_at`. `redirect(`/sets/${id}`)`
- [ ] T035 [US3] Manually verify per spec.md US3 acceptance scenarios 1–9 including cross-user test: user B viewing user A's public set sees zero edit/delete UI (visual + attempting a direct URL update from user B's session is rejected by RLS)

**Checkpoint**: A user can maintain their own content end-to-end. US1's seed data is no longer needed — everything is creatable through the UI.

---

## Phase 6: User Story 4 - 다른 사용자의 공개 문제집 둘러보기 (Priority: P3)

**Goal**: A logged-in user can browse the global list of public question sets and open them in read-only study mode.

**Independent Test**: User A has a public set. User B (different account) visits `/public-sets`, sees A's set with A's username, opens it, studies it, and finds no edit/delete/add UI anywhere.

### Implementation for User Story 4

- [X] T036 [US4] Create `app/public-sets/page.js` as a Server Component: fetch all public sets with owner username (contracts Q2). Render a list; each row links to `/public-sets/{id}` and shows title + `by {owner.username}` + created_at. Empty state: "아직 공개된 문제집이 없습니다"
- [X] T037 [US4] Create `app/public-sets/[id]/page.js` as a Server Component: fetch set (Q3, expect `is_public = true`), question count (Q7 but only `count`), owner username. If not found or not public → 404. Render title + `by {owner.username}` + question count + two entry buttons ("학습 모드로 열기", "암기 모드로 열기") that link to `/public-sets/{id}/study?mode=...&i=0` (route created in T021). **No edit / delete / add / import controls** (FR-024)
- [X] T038 [US4] Verify Nav (T014) includes a `<Link href="/public-sets">공개 문제집</Link>` visible when logged in

**Checkpoint**: All four stories are complete and each is independently demonstrable.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T039 [P] Run `npm run lint`; fix any warnings (Next.js default ESLint config, no custom rules)
- [X] T040 [P] Run `npm run build`; confirm success without any TypeScript prompt or missing-config error. Boot with `npm run start` and load `/` to smoke-test
- [X] T041 [P] Constitution compliance sweep: `git grep -nE "\.tsx?$"` returns nothing; `package.json` has no `typescript`, `@types/*`, or `ts-node` entries; no `tsconfig.json` exists; no `server.js` at root; `next.config.js` does not set `output: 'standalone'`
- [X] T042 [P] Update `README.md`: (1) confirm the "폴더 구조" tree matches the final scaffold (contains `middleware.js`, `supabase/`, `lib/queries.js`, `lib/username.js`, `lib/auth-actions.js`); (2) confirm the "Supabase에 올릴 SQL 파일" is referenced under "Vercel에 배포하기" step 0 and under "로컬에서 실행하기" prerequisites
- [ ] T043 Run through [quickstart.md](./quickstart.md) sections 3.1 – 3.4 in a private browser window. Log any deviations
- [ ] T044 Deploy to Vercel per quickstart.md section 4. Re-run 3.1 – 3.4 against the deployed URL

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: no dependencies — start immediately
- **Phase 2 (Foundational)**: depends on Phase 1 — **BLOCKS all user stories**
- **Phase 3 (US1 · MVP)**: depends on Phase 2 — testable in isolation via seed data; fully testable via UI only after Phase 4
- **Phase 4 (US2 · Auth)**: depends on Phase 2 — can run in parallel with Phase 3 if two developers; sequentially, Phase 4 unlocks UI-only testing of Phase 3
- **Phase 5 (US3 · CRUD)**: depends on Phase 2. Independent of Phase 3 (creation doesn't need study), but needs Phase 4 in practice so a user can log in and create things
- **Phase 6 (US4 · Discovery)**: depends on Phase 2. Practically needs Phase 5 to produce public sets to discover (or seed data). Route created in T021 (Phase 3) already covers the study half
- **Phase 7 (Polish)**: depends on all desired stories being complete

### Within Each Phase

- Any two tasks marked `[P]` touch different files — they can run concurrently
- Non-`[P]` tasks either edit the same file as a preceding task or logically depend on it
- Server Actions and their consuming pages are usually the same file, so both live in the same task

### Parallel Opportunities

Phase 1 (after T001):
```text
T002 · T003 · T004 · T005 · T006     (all parallel)
```

Phase 2 (after T008):
```text
T009 · T010 · T011 · T013 · T014 · T016     (all parallel)
T012 (middleware) sequential — needs T010
T015 (layout) sequential — needs T014
T017 (page.js redirect) sequential — needs T010
```

Phase 3 (US1):
```text
T018 · T019     (parallel, different files)
T020 sequential — needs T018 and T019
T021 parallel with T020 (different file, same imports)
```

Phase 4 (US2):
```text
T022 first
T023 · T024 parallel (different files, both consume T022 exports)
T025 manual verification
```

Phase 5 (US3):
```text
T026 · T027 · T028 all parallel (three separate component files)
T029 sequential (uses none of them directly)
T030 · T032 · T033 · T034 parallel with each other after T027/T028 exist
T031 sequential (root list page shell for the story)
T035 manual verification at the end
```

Phase 6 (US4):
```text
T036 · T037 parallel
T038 sequential — updates existing Nav file
```

Phase 7:
```text
T039 · T040 · T041 · T042 all parallel
T043 · T044 manual at the end
```

---

## Implementation Strategy

### MVP First (End at Checkpoint of Phase 3)

1. Complete Phase 1: Setup (T001–T006)
2. Complete Phase 2: Foundational (T007–T017) — includes running `supabase/schema.sql`
3. Complete Phase 3: US1 (T018–T021)
4. **STOP · VALIDATE**: Seed one user + one set + three questions via Supabase dashboard; log in via Supabase JS (or borrow the Phase 4 login page early); walk through all six US1 acceptance scenarios in both modes. This is your MVP.

### Incremental Delivery (recommended for a solo learner)

1. MVP as above
2. Add Phase 4 (US2) → deploy → auth works from the UI
3. Add Phase 5 (US3) → deploy → self-service authoring works
4. Add Phase 6 (US4) → deploy → discovery works
5. Polish (Phase 7) → deploy final

### Practical Ordering Note

Even though US1 is P1 (highest value) and US2 is P2, in practice most developers build **Phase 4 (US2 auth) before finishing Phase 3 validation** because the UI login flow is easier than manual seed + session injection. That is fine — it does not change the value ranking, only the build order.

---

## Notes

- `[P]` = different files, no dependency on incomplete work
- `[US#]` label maps each user-story task back to spec.md for traceability
- Story files stay under one story where possible so stories remain deletable/reorderable
- Manual validation is the test suite for this project (Constitution IV) — Phase 7's T043 is the definitive pre-deploy pass
- Do NOT introduce `.ts`, `.tsx`, or `@types/*` at any point (Constitution II)
- Do NOT add `server.js` or `output: 'standalone'` (Constitution III)
