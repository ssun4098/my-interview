-- =============================================================================
-- my-interview  |  Supabase schema (Postgres + Row Level Security)
-- Features: 001-question-viewer + 002-signup-approval-redesign +
--           005-question-file-uploads
--
-- How to apply:
--   1. Open your Supabase project → SQL Editor → New query.
--   2. Paste this entire file and click "Run".
--   3. Safe to re-run: statements use `if not exists` / `drop policy ...
--      create policy` patterns and are idempotent.
--
-- WHAT THIS FILE DEFINES
--   - Tables:   profiles (with is_approved), question_sets, questions
--   - Trigger:  auto-update `updated_at` on question_sets & questions
--   - RLS:      enabled on all three tables; policies enforce ownership,
--               public/private visibility, AND approved-user gating on the
--               domain tables (question_sets, questions).
--   - Storage:  private `question-files` bucket (rich-text editor image
--               uploads) with RLS policies mirroring the questions table.
--
-- ONE-TIME BACKFILL FOR 002 MIGRATION
--   The 002 migration adds `is_approved` with default `false`. To keep the
--   existing owner account(s) working, the block near the bottom of this file
--   must be uncommented ONCE on the initial 002 run and RE-COMMENTED afterwards
--   so that later re-runs do not accidentally auto-approve new pending users.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Extensions
-- -----------------------------------------------------------------------------
create extension if not exists "pgcrypto";  -- provides gen_random_uuid()


-- -----------------------------------------------------------------------------
-- profiles: 1:1 with auth.users, holds the public-facing username and the
-- approval flag introduced in 002.
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
    id           uuid primary key references auth.users(id) on delete cascade,
    username     text not null,
    created_at   timestamptz not null default now(),
    constraint profiles_username_lowercase_chk check (username = lower(username)),
    constraint profiles_username_format_chk    check (username ~ '^[a-z0-9._-]{3,32}$')
);
alter table public.profiles enable row level security;

-- 002 migration: approval flag. Default `false` gates all new signups until
-- the owner flips it to `true` via the SQL Editor.
alter table public.profiles
    add column if not exists is_approved boolean not null default false;

create unique index if not exists profiles_username_key
    on public.profiles (username);


-- -----------------------------------------------------------------------------
-- question_sets
-- -----------------------------------------------------------------------------
create table if not exists public.question_sets (
    id           uuid primary key default gen_random_uuid(),
    owner_id     uuid not null references public.profiles(id) on delete cascade,
    title        text not null,
    is_public    boolean not null default false,
    created_at   timestamptz not null default now(),
    updated_at   timestamptz not null default now(),
    constraint question_sets_title_len_chk check (char_length(title) between 1 and 200)
);
alter table public.question_sets enable row level security;

create index if not exists question_sets_owner_id_idx
    on public.question_sets (owner_id);

create index if not exists question_sets_public_idx
    on public.question_sets (is_public) where is_public = true;


-- -----------------------------------------------------------------------------
-- questions
-- -----------------------------------------------------------------------------
create table if not exists public.questions (
    id                uuid primary key default gen_random_uuid(),
    question_set_id   uuid not null references public.question_sets(id) on delete cascade,
    title             text not null,
    content           text not null,
    keywords          text[] not null default '{}',
    created_at        timestamptz not null default now(),
    updated_at        timestamptz not null default now(),
    constraint questions_title_len_chk   check (char_length(title)   between 1 and 200),
    constraint questions_content_len_chk check (char_length(content) between 0 and 5000)
);
alter table public.questions enable row level security;

create index if not exists questions_set_created_idx
    on public.questions (question_set_id, created_at);

-- 005 migration: content is now Tiptap-authored HTML (rich text + inline
-- images), not plain text, so it needs more headroom than the original
-- 5000-char plain-text limit.
alter table public.questions
    drop constraint if exists questions_content_len_chk;
alter table public.questions
    add constraint questions_content_len_chk check (char_length(content) between 0 and 20000);


-- -----------------------------------------------------------------------------
-- Trigger: keep updated_at fresh on UPDATE. created_at is never touched.
-- -----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at := now();
    return new;
end;
$$;

drop trigger if exists question_sets_touch on public.question_sets;
create trigger question_sets_touch
    before update on public.question_sets
    for each row execute function public.touch_updated_at();

drop trigger if exists questions_touch on public.questions;
create trigger questions_touch
    before update on public.questions
    for each row execute function public.touch_updated_at();


-- -----------------------------------------------------------------------------
-- Row Level Security Policies
-- Domain-table policies (question_sets, questions) require both ownership/
-- visibility AND that the caller is an APPROVED profile. profiles policies
-- are left unchanged so that the middleware and the profile page can always
-- read the caller's own approval status.
-- -----------------------------------------------------------------------------

-- ----- profiles ---------------------------------------------------------------

drop policy if exists profiles_select_authenticated on public.profiles;
create policy profiles_select_authenticated on public.profiles
    for select
    to authenticated
    using (true);

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles
    for insert
    to authenticated
    with check (id = auth.uid());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
    for update
    to authenticated
    using (id = auth.uid())
    with check (id = auth.uid());


-- ----- question_sets  (all policies gated on is_approved) ---------------------

drop policy if exists question_sets_select on public.question_sets;
create policy question_sets_select on public.question_sets
    for select
    to authenticated
    using (
        exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.is_approved = true
        )
        and (owner_id = auth.uid() or is_public = true)
    );

drop policy if exists question_sets_insert on public.question_sets;
create policy question_sets_insert on public.question_sets
    for insert
    to authenticated
    with check (
        exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.is_approved = true
        )
        and owner_id = auth.uid()
    );

drop policy if exists question_sets_update on public.question_sets;
create policy question_sets_update on public.question_sets
    for update
    to authenticated
    using (
        exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.is_approved = true
        )
        and owner_id = auth.uid()
    )
    with check (
        exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.is_approved = true
        )
        and owner_id = auth.uid()
    );

drop policy if exists question_sets_delete on public.question_sets;
create policy question_sets_delete on public.question_sets
    for delete
    to authenticated
    using (
        exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.is_approved = true
        )
        and owner_id = auth.uid()
    );


-- ----- questions  (all policies gated on is_approved) ------------------------

drop policy if exists questions_select on public.questions;
create policy questions_select on public.questions
    for select
    to authenticated
    using (
        exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.is_approved = true
        )
        and exists (
            select 1 from public.question_sets s
            where s.id = questions.question_set_id
              and (s.owner_id = auth.uid() or s.is_public = true)
        )
    );

drop policy if exists questions_insert on public.questions;
create policy questions_insert on public.questions
    for insert
    to authenticated
    with check (
        exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.is_approved = true
        )
        and exists (
            select 1 from public.question_sets s
            where s.id = questions.question_set_id
              and s.owner_id = auth.uid()
        )
    );

drop policy if exists questions_update on public.questions;
create policy questions_update on public.questions
    for update
    to authenticated
    using (
        exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.is_approved = true
        )
        and exists (
            select 1 from public.question_sets s
            where s.id = questions.question_set_id
              and s.owner_id = auth.uid()
        )
    )
    with check (
        exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.is_approved = true
        )
        and exists (
            select 1 from public.question_sets s
            where s.id = questions.question_set_id
              and s.owner_id = auth.uid()
        )
    );

drop policy if exists questions_delete on public.questions;
create policy questions_delete on public.questions
    for delete
    to authenticated
    using (
        exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.is_approved = true
        )
        and exists (
            select 1 from public.question_sets s
            where s.id = questions.question_set_id
              and s.owner_id = auth.uid()
        )
    );


-- -----------------------------------------------------------------------------
-- 005: question-files Storage bucket
-- Holds images embedded in the question content rich-text editor. The
-- bucket is PRIVATE — objects are served through app/files/[...path]/route.js,
-- which resolves a fresh short-lived signed URL per request after Supabase
-- checks the caller against the RLS policies below. This keeps question
-- content's embedded <img src="/files/..."> URLs stable forever (they never
-- need to be rewritten), while access still tracks question_sets.is_public
-- exactly like the questions table does.
--
-- Object path convention: `{question_set_id}/{random-filename}`, enforced by
-- lib/storage.js on upload and relied on below via storage.foldername().
-- -----------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'question-files',
    'question-files',
    false,
    5242880, -- 5MB
    array['image/png', 'image/jpeg', 'image/gif', 'image/webp']
)
on conflict (id) do update
set file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists question_files_select on storage.objects;
create policy question_files_select on storage.objects
    for select
    to authenticated
    using (
        bucket_id = 'question-files'
        and exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.is_approved = true
        )
        and exists (
            select 1 from public.question_sets s
            where s.id = ((storage.foldername(name))[1])::uuid
              and (s.owner_id = auth.uid() or s.is_public = true)
        )
    );

drop policy if exists question_files_insert on storage.objects;
create policy question_files_insert on storage.objects
    for insert
    to authenticated
    with check (
        bucket_id = 'question-files'
        and exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.is_approved = true
        )
        and exists (
            select 1 from public.question_sets s
            where s.id = ((storage.foldername(name))[1])::uuid
              and s.owner_id = auth.uid()
        )
    );

drop policy if exists question_files_delete on storage.objects;
create policy question_files_delete on storage.objects
    for delete
    to authenticated
    using (
        bucket_id = 'question-files'
        and exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.is_approved = true
        )
        and exists (
            select 1 from public.question_sets s
            where s.id = ((storage.foldername(name))[1])::uuid
              and s.owner_id = auth.uid()
        )
    );


-- =============================================================================
-- ONE-TIME BACKFILL BLOCK  (uncomment ONCE for the 002 migration, then
-- re-comment before re-running this file to avoid auto-approving future
-- pending users)
-- =============================================================================

-- update public.profiles set is_approved = true where is_approved = false;

-- =============================================================================
-- Done. Verify:
--   Table Editor → public.profiles → is_approved column exists (boolean)
--   Existing rows have is_approved = true after the backfill runs
--   Authentication → Policies shows the updated policies on question_sets/questions
-- =============================================================================
