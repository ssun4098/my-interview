-- =============================================================================
-- my-interview  |  Supabase schema (Postgres + Row Level Security)
-- Features: 001-question-viewer + 002-signup-approval-redesign +
--           005-question-file-uploads + 006-categories
--
-- How to apply:
--   1. Open your Supabase project → SQL Editor → New query.
--   2. Paste this entire file and click "Run".
--   3. Safe to re-run: statements use `if not exists` / `drop policy ...
--      create policy` patterns and are idempotent.
--
-- WHAT THIS FILE DEFINES
--   - Tables:   profiles (with is_approved), question_sets, questions,
--               categories + question_set_categories + question_categories
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


-- =============================================================================
-- 006: 카테고리 (categories + 두 개의 조인 테이블) & questions."order"
--
-- categories 는 모든 승인된 사용자가 공유하는 전역 태그 사전입니다.
-- 문제집(question_set_categories)과 문제(question_categories)에 N:M 으로 붙습니다.
-- 조인 테이블의 RLS 는 각각 question_sets / questions 의 정책을 그대로 따라갑니다.
-- =============================================================================

-- ----- questions."order" -----------------------------------------------------
-- lib/queries.js / lib/question-actions.js 가 정렬·재정렬에 사용합니다.
alter table public.questions
    add column if not exists "order" integer not null default 0;

create index if not exists questions_set_order_idx
    on public.questions (question_set_id, "order");
-- ----- categories -------------------------------------------------------------
-- 모든 승인된 사용자가 공유하는 전역 태그 사전이지만, 행마다 만든 사람(owner_id)을
-- 기록해 이름 수정/삭제는 소유자만 할 수 있게 합니다. question_sets 와 동일한
-- 소유권 모델이며, owner_id 는 앱(lib/category-actions.js)이 명시적으로 넣습니다.
create table if not exists public.categories (
    id          uuid primary key default gen_random_uuid(),
    owner_id    uuid not null references public.profiles(id) on delete cascade,
    name        text not null,
    created_at  timestamptz not null default now(),
    constraint categories_name_len_chk check (char_length(name) between 1 and 50)
);
alter table public.categories enable row level security;

-- 손으로 먼저 만들어 둔 테이블과의 정합용 (이미 맞으면 아무 일도 하지 않습니다)
alter table public.categories
    add column if not exists owner_id uuid references public.profiles(id) on delete cascade;
alter table public.categories
    add column if not exists created_at timestamptz not null default now();

create index if not exists categories_owner_id_idx
    on public.categories (owner_id);

-- 대소문자만 다른 중복을 막습니다. 위반 시 Postgres 가 23505 를 반환하고,
-- lib/category-actions.js 가 기존 행을 찾아 그대로 선택시켜 줍니다.
create unique index if not exists categories_name_lower_key
    on public.categories (lower(name));

drop policy if exists categories_select on public.categories;
drop policy if exists categories_insert on public.categories;
drop policy if exists categories_update_own on public.categories;
drop policy if exists categories_delete_own on public.categories;

-- 이전 리비전에서 잠깐 쓰던 컬럼. owner_id 와 역할이 겹쳐 제거합니다.
-- (위에서 참조 정책을 먼저 지웠기 때문에 여기서 안전하게 드롭됩니다)
alter table public.categories drop column if exists created_by;

-- 조회는 승인된 사용자 모두에게 열려 있습니다 (공용 사전).
create policy categories_select on public.categories
    for select
    to authenticated
    using (
        exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.is_approved = true
        )
    );

create policy categories_insert on public.categories
    for insert
    to authenticated
    with check (
        exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.is_approved = true
        )
        and owner_id = auth.uid()
    );

-- 이름 수정/삭제는 만든 사람만.
create policy categories_update_own on public.categories
    for update
    to authenticated
    using (owner_id = auth.uid())
    with check (owner_id = auth.uid());

create policy categories_delete_own on public.categories
    for delete
    to authenticated
    using (owner_id = auth.uid());



-- ----- question_set_categories  (문제집 ↔ 카테고리) ----------------------------
create table if not exists public.question_set_categories (
    question_set_id uuid not null references public.question_sets(id) on delete cascade,
    category_id     uuid not null references public.categories(id)    on delete cascade,
    created_at      timestamptz not null default now(),
    primary key (question_set_id, category_id)
);
alter table public.question_set_categories enable row level security;

create index if not exists question_set_categories_category_idx
    on public.question_set_categories (category_id);

drop policy if exists question_set_categories_select on public.question_set_categories;
create policy question_set_categories_select on public.question_set_categories
    for select
    to authenticated
    using (
        exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.is_approved = true
        )
        and exists (
            select 1 from public.question_sets s
            where s.id = question_set_categories.question_set_id
              and (s.owner_id = auth.uid() or s.is_public = true)
        )
    );

drop policy if exists question_set_categories_insert on public.question_set_categories;
create policy question_set_categories_insert on public.question_set_categories
    for insert
    to authenticated
    with check (
        exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.is_approved = true
        )
        and exists (
            select 1 from public.question_sets s
            where s.id = question_set_categories.question_set_id
              and s.owner_id = auth.uid()
        )
    );

drop policy if exists question_set_categories_delete on public.question_set_categories;
create policy question_set_categories_delete on public.question_set_categories
    for delete
    to authenticated
    using (
        exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.is_approved = true
        )
        and exists (
            select 1 from public.question_sets s
            where s.id = question_set_categories.question_set_id
              and s.owner_id = auth.uid()
        )
    );


-- ----- question_categories  (문제 ↔ 카테고리) ---------------------------------
create table if not exists public.question_categories (
    question_id  uuid not null references public.questions(id)  on delete cascade,
    category_id  uuid not null references public.categories(id) on delete cascade,
    created_at   timestamptz not null default now(),
    primary key (question_id, category_id)
);
alter table public.question_categories enable row level security;

create index if not exists question_categories_category_idx
    on public.question_categories (category_id);

drop policy if exists question_categories_select on public.question_categories;
create policy question_categories_select on public.question_categories
    for select
    to authenticated
    using (
        exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.is_approved = true
        )
        and exists (
            select 1 from public.questions q
            join public.question_sets s on s.id = q.question_set_id
            where q.id = question_categories.question_id
              and (s.owner_id = auth.uid() or s.is_public = true)
        )
    );

drop policy if exists question_categories_insert on public.question_categories;
create policy question_categories_insert on public.question_categories
    for insert
    to authenticated
    with check (
        exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.is_approved = true
        )
        and exists (
            select 1 from public.questions q
            join public.question_sets s on s.id = q.question_set_id
            where q.id = question_categories.question_id
              and s.owner_id = auth.uid()
        )
    );

drop policy if exists question_categories_delete on public.question_categories;
create policy question_categories_delete on public.question_categories
    for delete
    to authenticated
    using (
        exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.is_approved = true
        )
        and exists (
            select 1 from public.questions q
            join public.question_sets s on s.id = q.question_set_id
            where q.id = question_categories.question_id
              and s.owner_id = auth.uid()
        )
    );


-- ----- 006 grants -------------------------------------------------------------
-- Supabase 의 기본 권한(default privileges)이 적용되지 않은 채 테이블이 만들어진
-- 경우(예: 다른 롤로 미리 생성) PostgREST 가 RLS 이전 단계에서 403
-- "permission denied for table" 을 돌려줍니다. 명시적으로 부여해 둡니다.
-- 실제 접근 제어는 위의 RLS 정책이 담당합니다.
grant select, insert, update, delete on public.categories              to authenticated;
grant select, insert,         delete on public.question_set_categories to authenticated;
grant select, insert,         delete on public.question_categories     to authenticated;
