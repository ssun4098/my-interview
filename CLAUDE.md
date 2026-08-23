# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan at
[specs/004-fresh-ui-restart/plan.md](specs/004-fresh-ui-restart/plan.md).

Constitution: [.specify/memory/constitution.md](.specify/memory/constitution.md)
Current feature spec: [specs/004-fresh-ui-restart/spec.md](specs/004-fresh-ui-restart/spec.md)
Previous feature specs:
  - [specs/003-modern-app-ui/spec.md](specs/003-modern-app-ui/spec.md) (Linear-tone redesign, superseded by 004)
  - [specs/002-signup-approval-redesign/spec.md](specs/002-signup-approval-redesign/spec.md) (approval + auth, still live)
  - [specs/001-question-viewer/spec.md](specs/001-question-viewer/spec.md) (question viewer MVP)
Design references: [DESIGN.md](DESIGN.md) · Toss · Naver Webtoon · Telegram (spec 004 anchors)
Supabase schema (user applies manually): [supabase/schema.sql](supabase/schema.sql)
<!-- SPECKIT END -->

## Commands

- `npm run dev` — local dev server (http://localhost:3000)
- `npm run build` — production build (also the fastest way to catch route/type/import errors)
- `npm run lint` — Next.js ESLint check
- `npm run start` — run the production build locally

No test framework is installed. The constitution treats tests as opt-in per spec; validation is manual per each spec's `quickstart.md`.

## Hard constraints (from constitution)

Violating any of these will break the project's ground rules — see [.specify/memory/constitution.md](.specify/memory/constitution.md):

- **JavaScript only.** No `.ts`/`.tsx`, no `tsconfig.json`, no `@types/*` or `typescript` in `package.json`.
- **No custom server.** No `server.js`, no `output: 'standalone'` in `next.config.js`.
- **Supabase is the only backend.** No other DB clients, no ORMs, no auth libraries.
- **No footer.** Any spec that renders `<footer>` breaks the rule (checked via `document.querySelector('footer') === null`).
- **Add a dependency only when the same result cannot be achieved in ~20 lines.** In particular the current shape rules out `framer-motion`, `tailwindcss`, `radix-ui`, icon libraries — motion is done with `app/template.js` + CSS keyframes; icons are inline SVG in `components/icons/index.js`.

## Big-picture architecture

### The three specs layer on top of each other

- **001** built the CRUD + study MVP.
- **002** added a per-account `is_approved` gate and swapped Nav for a top-bar/bottom-tab shell (later superseded).
- **003** replaced the visual system with a Linear-tone one and moved the shell to a **collapsible left sidebar** (desktop always visible, mobile drawer via hamburger). The current UI is the 003 shape; 002's UI decisions are historical, but its auth/RLS/data logic is still live.

### Auth flow has an unusual shape

The app exposes **username-only login** to users. Internally it maps `username` → `{normalized}@my-interview.local` synthetic email and uses Supabase Auth's email/password. See [lib/username.js](lib/username.js).

`signUp` in [lib/auth-actions.js](lib/auth-actions.js) uses `admin.auth.admin.createUser` via [lib/supabase-admin.js](lib/supabase-admin.js) (service_role key) instead of `auth.signUp` — this bypasses Supabase's email rate limit that was blocking signups with fake `.local` domains.

`signIn` checks `profiles.is_approved` **after** a successful password check and calls `signOut` if pending — the app returns a distinct pending message rather than the generic credential error. Order matters: credential-error wins over approval-status leaks.

### Access is gated in two places (defense in depth)

1. `middleware.js` — for every request, fetches `profiles.is_approved` and redirects unapproved users to `/login?revoked=1`.
2. `supabase/schema.sql` RLS policies on `question_sets` and `questions` — every SELECT/INSERT/UPDATE/DELETE also requires an approved profile via an `EXISTS` clause.

`profiles` policies are intentionally **not** gated on approval, so the middleware/profile page can read the caller's own approval status without a chicken-and-egg problem.

### Data access convention

There is no repository/service layer — Server Components and Server Actions call the Supabase JS client directly. RLS is the authorization mechanism. When adding a new query, mimic the pattern in [lib/queries.js](lib/queries.js) or the `*-actions.js` files; do not introduce an ORM.

- `lib/supabase-server.js` — SSR client for Server Components / Server Actions (reads cookies)
- `lib/supabase-browser.js` — client-side use (rare in this app)
- `lib/supabase-admin.js` — service_role key, **server-only**, used only in `signUp`

### Schema is managed by hand, not by migrations

[supabase/schema.sql](supabase/schema.sql) is the single source of truth. The user runs it manually in the Supabase Dashboard's SQL Editor. The file is idempotent (`create table if not exists`, `drop policy if exists ... create policy ...`).

**One-time backfill trap**: the file contains a commented-out backfill line `update public.profiles set is_approved = true where is_approved = false;`. This must be uncommented **once** on the initial 002 deploy to grandfather existing accounts, then re-commented so re-runs don't auto-approve new pending users.

### App Router structure has motion-critical files

- `app/layout.js` — Root layout is **`async`** (fetches profile server-side) and has `export const dynamic = 'force-dynamic'`. **Do not remove `dynamic = 'force-dynamic'`** — without it, Next tries to prerender `/404` and `/500` with the async layout and the build fails with a `_document` module-not-found error.
- `app/template.js` — Server Component with a single `<div className="page-transition">` wrapper. Next.js remounts `template.js` on every route change, which retriggers the CSS `pageIn` keyframe. This is the entire page-transition system; there is no animation library.
- `app/*/loading.js` — Suspense fallbacks per route (skeleton screens using `components/Skeleton.js`).

### AppShell + Sidebar are the only nav

- `components/AppShell.js` (Client Component) reads `usePathname()`, hides the sidebar entirely on auth routes (`/login`, `/signup`) and study routes (`/sets/*/study`, `/public-sets/*/study`), and passes collapse/drawer state to `<Sidebar>`.
- `components/Sidebar.js` handles both desktop (fixed left, collapsible to icon rail) and mobile (slide-in drawer with backdrop, opened by a `<div className="mobile-topbar">` at the top of the viewport).
- Responsive switching between the two modes is done in CSS (`@media (min-width: 641px)` in [app/globals.css](app/globals.css)), not JS — this avoids hydration mismatch and initial-frame flicker.

### Design tokens live in one place

All colors, spacing, radii, typography, motion durations, and layout dimensions are CSS custom properties defined in `:root` inside [app/globals.css](app/globals.css). Components consume them via inline styles referencing `var(--…)`. There are no CSS modules and no CSS-in-JS runtime.

Motion rules also live in globals.css:
- Global `button, a[href]` transitions + `:active { transform: scale(0.98) }` for press feedback
- Global `:focus-visible { outline: 2px solid var(--color-primary) }` for keyboard a11y
- Global `@media (prefers-reduced-motion: reduce)` sets all `animation-duration` / `transition-duration` to `0.01ms !important` — no per-component reduced-motion code needed

### Server Actions and confirm dialogs

Server Actions cannot receive event handler props from Server Components. If a page needs a `confirm()` before submitting a form, it must delegate to a Client Component. The canonical example is [components/ConfirmDeleteForm.js](components/ConfirmDeleteForm.js), used by `app/sets/[id]/page.js` for the delete-set and delete-question buttons. Follow this pattern for any new confirm-before-submit flows.

## Spec Kit workflow

This repository is managed with [Spec Kit](.specify/). New features go through:

1. `/speckit-specify` — write the feature specification
2. `/speckit-clarify` — resolve ambiguities (optional but recommended)
3. `/speckit-plan` — technical plan and design artifacts
4. `/speckit-tasks` — task list
5. `/speckit-implement` — execute the tasks

Feature branches follow `NNN-short-name`. The current feature dir is tracked in [.specify/feature.json](.specify/feature.json).
