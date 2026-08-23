<!--
Sync Impact Report
==================
Version change: (initial) → 1.0.0
Rationale: First ratification of the my-interview project constitution. MINOR-level
initial adoption (no prior version to compare); "1.0.0" chosen because these
principles are considered stable and load-bearing from day one.

Modified principles: (none — initial adoption)
Added sections:
  - Core Principles (I–V)
  - Technology & Deployment Constraints
  - Development Workflow
  - Governance
Removed sections: (none)

Templates checked:
  - .specify/templates/plan-template.md            ✅ compatible (no edits needed;
      Constitution Check gate remains generic; Technical Context slots align with
      the stack pinned here)
  - .specify/templates/spec-template.md            ✅ compatible (spec is
      technology-agnostic; principles do not add mandatory spec sections)
  - .specify/templates/tasks-template.md           ✅ compatible (test tasks
      remain optional; simplicity principle is compatible with default phases)
  - .specify/templates/checklist-template.md       ✅ compatible (no changes)
  - README.md                                      ⚠ pending (to be authored per
      user request documenting the simple structure)

Follow-up TODOs: none.
-->

# my-interview Constitution

Interview-preparation web app built on Next.js + Supabase, deployed to Vercel.
The primary maintainer is new to Next.js; every rule below optimizes for
learnability and low ceremony over cleverness.

## Core Principles

### I. Simplicity First (NON-NEGOTIABLE)

The project MUST stay small enough that a Next.js beginner can navigate it
end-to-end in one sitting. Prefer fewer files, fewer folders, and fewer
abstractions. When two approaches solve the same problem, choose the one with
less indirection. Rationale: the maintainer is learning Next.js — every extra
layer (custom hooks, wrappers, generic helpers) is a comprehension tax that must
be paid every time the code is revisited. YAGNI is enforced: do not add
patterns for a future use case that has not been specified.

### II. JavaScript Only

All application code MUST be written in JavaScript (`.js`, `.jsx`). TypeScript
(`.ts`, `.tsx`), `tsconfig.json`, and `@types/*` dependencies are prohibited.
JSDoc annotations are permitted where they aid clarity, but MUST NOT be used to
simulate a type system. Rationale: keeping to one language removes a whole
category of tooling and syntax the maintainer would otherwise have to learn
before shipping.

### III. Vercel-Ready by Default

Every feature MUST work under Vercel's serverless execution model without
additional configuration. This means: no reliance on a long-running Node
process, no local filesystem writes at runtime, no background workers or cron
inside the app, and no environment-specific hacks that only run in a local
`next dev` server. Secrets and configuration MUST be read from `process.env`
and MUST be listed in `.env.example`. Rationale: the deployment target is
Vercel; a feature that only works locally is not shippable.

### IV. Supabase Is the Only Backend

Persistence, authentication, storage, and server-side data access MUST go
through Supabase. Do not add a second database, a separate ORM, a custom auth
system, or a bespoke API server. Server-side Supabase access MUST use the
service-role key only inside server code (Route Handlers, Server Components, or
Server Actions); the anon key is used from the browser. Rationale: one backend
means one mental model, one set of credentials, and one place to look when
something breaks.

### V. Structure Documented in README (NON-NEGOTIABLE)

The `README.md` at the repository root MUST document the project's folder
layout, environment variables, local run steps, and Vercel deploy steps. When
the folder layout, required env vars, or run/deploy commands change, the
README MUST be updated in the same change set. Rationale: the maintainer
expects the README to be the single onboarding document; letting it drift
defeats the whole purpose of keeping the project simple.

## Technology & Deployment Constraints

- **Framework**: Next.js (App Router). Do not mix the legacy `pages/` router
  with the App Router in the same project.
- **Language**: JavaScript only (see Principle II).
- **Backend**: Supabase (`@supabase/supabase-js`, and `@supabase/ssr` for
  Next.js server integration). No other database client.
- **Styling**: Plain CSS Modules or Tailwind CSS. Do not introduce a
  CSS-in-JS runtime library.
- **Hosting**: Vercel. All routes MUST be deployable as either static or
  serverless functions — no custom server (`server.js`) and no `output:
  'standalone'` container build.
- **Environment variables**: Public values MUST be prefixed `NEXT_PUBLIC_`.
  Server-only secrets (e.g., `SUPABASE_SERVICE_ROLE_KEY`) MUST NEVER be
  prefixed `NEXT_PUBLIC_` and MUST NEVER be imported into client components.
  Every variable used at runtime MUST appear in `.env.example` with a safe
  placeholder value.
- **Dependencies**: Add a dependency only when the same result cannot be
  achieved in ~20 lines of project code. New dependencies MUST be justified in
  the plan for the feature that introduces them.

## Development Workflow

- **Local run**: `npm install` then `npm run dev` MUST be sufficient to boot
  the app against a Supabase project defined by `.env.local`.
- **Deploy**: Pushing to the default branch MUST produce a working Vercel
  deployment with no manual build steps beyond setting env vars in the Vercel
  dashboard.
- **Branching**: Feature work happens on branches created by
  `/speckit-specify` (see `.specify/`). Direct commits to `main` are reserved
  for docs, config, and constitution changes.
- **Testing**: Automated tests are OPTIONAL for this project and are added
  only when a specification explicitly requests them (per the Spec Kit tasks
  template). When tests are added, they MUST run with `npm test` and MUST NOT
  require a live Supabase connection unless the test is explicitly labelled as
  an integration test.
- **Review gate**: Before a feature is considered done, a reviewer (or the
  maintainer self-reviewing) MUST confirm the change (a) still boots with
  `npm run dev`, (b) still deploys to Vercel, and (c) leaves the README
  accurate.

## Governance

This constitution supersedes ad-hoc conventions elsewhere in the repository.
When a plan, spec, or task conflicts with a principle here, the constitution
wins and the other artifact MUST be updated.

- **Amendments**: Any change to this file MUST bump the version below using
  semantic versioning:
  - **MAJOR**: a principle is removed or redefined in a backward-incompatible
    way (e.g., allowing TypeScript, changing the backend away from Supabase).
  - **MINOR**: a new principle or a new mandatory section is added, or an
    existing principle is materially expanded.
  - **PATCH**: wording, typo, or clarification changes that do not alter
    behavior.
- **Sync obligation**: Amendments MUST include a Sync Impact Report (HTML
  comment at the top of this file) listing which templates and docs were
  reviewed and whether they required updates.
- **Compliance review**: Every `/speckit-plan` run MUST pass the "Constitution
  Check" gate before Phase 0. Violations MUST be recorded in the plan's
  Complexity Tracking table with a written justification, or the plan MUST be
  revised to comply.
- **Runtime guidance**: For day-to-day development guidance beyond principles
  (folder layout, commands, env vars), consult `README.md`.

**Version**: 1.0.0 | **Ratified**: 2026-08-21 | **Last Amended**: 2026-08-21
