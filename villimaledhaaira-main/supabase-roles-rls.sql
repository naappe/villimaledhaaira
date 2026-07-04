-- Villimale role-based access setup
-- Run this once in Supabase SQL Editor.
-- Then create users in Authentication > Users and insert their roles below.

create table if not exists public.user_roles (
    user_id uuid primary key references auth.users(id) on delete cascade,
    role text not null check (role in ('admin', 'member', 'viewer')),
    party text null check (party in ('MDP', 'PNC')),
    can_edit boolean not null default true,
    can_export boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;
alter table public.full_import
add column if not exists support_level text not null default 'normal';
alter table public.full_import
add column if not exists phone_status text not null default 'need-call';
alter table public.full_import
drop constraint if exists full_import_support_level_check;
alter table public.full_import
add constraint full_import_support_level_check
check (support_level in ('normal', 'guaranteed'));
alter table public.full_import
drop constraint if exists full_import_phone_status_check;
alter table public.full_import
add constraint full_import_phone_status_check
check (phone_status in ('need-call', 'called', 'wrong-number', 'out-of-range', 'no-phone'));
alter table public.full_import enable row level security;

drop policy if exists "public read voters" on public.full_import;
drop policy if exists "public update voters" on public.full_import;

revoke all privileges on public.full_import from anon;
revoke all privileges on public.full_import from authenticated;
revoke all privileges on public.user_roles from anon;
revoke all privileges on public.user_roles from authenticated;

grant select on public.user_roles to authenticated;
grant select on public.full_import to authenticated;
grant update (phone, phone_status, reach_status, vote_status, support_level, remarks) on public.full_import to authenticated;

drop policy if exists "Users can read own role" on public.user_roles;
create policy "Users can read own role"
on public.user_roles
for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Role based voter select" on public.full_import;
create policy "Role based voter select"
on public.full_import
for select
to authenticated
using (
    exists (
        select 1
        from public.user_roles ur
        where ur.user_id = (select auth.uid())
          and (
              ur.role = 'admin'
              or ur.party = full_import.party
          )
    )
);

drop policy if exists "Role based voter update" on public.full_import;
create policy "Role based voter update"
on public.full_import
for update
to authenticated
using (
    exists (
        select 1
        from public.user_roles ur
        where ur.user_id = (select auth.uid())
          and ur.can_edit = true
          and (
              ur.role = 'admin'
              or ur.party = full_import.party
          )
    )
)
with check (
    exists (
        select 1
        from public.user_roles ur
        where ur.user_id = (select auth.uid())
          and ur.can_edit = true
          and (
              ur.role = 'admin'
              or ur.party = full_import.party
          )
    )
);

-- Example role inserts.
-- Replace the email values with the actual Auth user emails after creating users.

-- Admin: can see all voters, can edit, no export on All Voters page by design.
-- insert into public.user_roles (user_id, role, party, can_edit, can_export)
-- select id, 'admin', null, true, false from auth.users where email = 'naappe@gmail.com'
-- on conflict (user_id) do update set role = excluded.role, party = excluded.party, can_edit = excluded.can_edit, can_export = excluded.can_export;

-- MDP user: can see/edit MDP only, no export unless you set can_export true.
-- insert into public.user_roles (user_id, role, party, can_edit, can_export)
-- select id, 'member', 'MDP', true, false from auth.users where email = 'mdp@villimale.local'
-- on conflict (user_id) do update set role = excluded.role, party = excluded.party, can_edit = excluded.can_edit, can_export = excluded.can_export;

-- PNC user: can see/edit PNC only, no export unless you set can_export true.
-- insert into public.user_roles (user_id, role, party, can_edit, can_export)
-- select id, 'member', 'PNC', true, false from auth.users where email = 'pnc@villimale.local'
-- on conflict (user_id) do update set role = excluded.role, party = excluded.party, can_edit = excluded.can_edit, can_export = excluded.can_export;

-- Viewer example: can see one party only, cannot edit, cannot export.
-- insert into public.user_roles (user_id, role, party, can_edit, can_export)
-- select id, 'viewer', 'MDP', false, false from auth.users where email = 'viewer@villimale.local'
-- on conflict (user_id) do update set role = excluded.role, party = excluded.party, can_edit = excluded.can_edit, can_export = excluded.can_export;
