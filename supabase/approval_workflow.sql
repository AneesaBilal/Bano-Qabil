-- ============================================================================
-- Bano Qabil LMS — Admin Approval Workflow migration
-- Run this AFTER schema.sql, policies.sql, and storage.sql have already been
-- applied. It only adds to the existing schema — nothing is dropped or
-- renamed, so all current data, policies, and functionality are preserved.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. New enum + columns on profiles
-- ----------------------------------------------------------------------------

create type approval_status as enum ('pending', 'approved', 'rejected');

alter table public.profiles
  add column if not exists approval_status approval_status not null default 'approved',
  add column if not exists rejection_reason text,
  add column if not exists reviewed_by uuid references public.profiles (id) on delete set null,
  add column if not exists reviewed_at timestamptz;

-- Backfill: anyone who already exists in the system today is grandfathered
-- in as approved so nobody currently active gets locked out.
update public.profiles set approval_status = 'approved' where approval_status is null;

create index if not exists idx_profiles_approval_status on public.profiles (approval_status);

-- ----------------------------------------------------------------------------
-- 2. Replace handle_new_user() so self-registered Students/Teachers start
--    'pending', while accounts provisioned by an Admin (via the create-user
--    Edge Function, which sets provisioned_by_admin: 'true' in user metadata)
--    are auto-approved, same as Admin/Super Admin signups.
-- ----------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_role user_role;
  v_status approval_status;
begin
  v_role := coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'student');

  if v_role in ('student', 'teacher')
     and coalesce(new.raw_user_meta_data ->> 'provisioned_by_admin', 'false') <> 'true' then
    v_status := 'pending';
  else
    v_status := 'approved';
  end if;

  insert into public.profiles (id, full_name, email, role, approval_status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email,
    v_role,
    v_status
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- (trigger `on_auth_user_created` already points at this function — no need
-- to recreate it, replacing the function body is enough.)

-- ----------------------------------------------------------------------------
-- 3. Helper used by RLS + the frontend to check approval before granting access
-- ----------------------------------------------------------------------------

create or replace function public.is_approved()
returns boolean as $$
  select coalesce(
    (select approval_status = 'approved' from public.profiles where id = auth.uid()),
    false
  );
$$ language sql stable security definer set search_path = public;

-- ----------------------------------------------------------------------------
-- 4. Allow admins to update approval_status / rejection_reason on other
--    profiles. The existing "admin/super_admin can update any profile"
--    policy from policies.sql already covers this in most setups, but this
--    is added defensively in case that policy was scoped more narrowly.
-- ----------------------------------------------------------------------------

drop policy if exists "admins manage approvals" on public.profiles;
create policy "admins manage approvals"
  on public.profiles for update
  using (public.is_admin_or_super())
  with check (public.is_admin_or_super());

-- ----------------------------------------------------------------------------
-- 5. Students who are pending or rejected should not be able to read
--    anything beyond their own profile row — this stops a pending account
--    from pulling batch/course/assignment data even if a UI bug let a
--    signed-in-but-unapproved session slip through the app-level check.
--    Replaces "students_select_self_staff_or_batch_teacher" from
--    policies.sql with the same logic plus an approval gate on the
--    self-read branch (staff/teacher access is untouched).
-- ----------------------------------------------------------------------------

drop policy if exists "students_select_self_staff_or_batch_teacher" on public.students;
create policy "students_select_self_staff_or_batch_teacher"
on public.students for select
using (
  (id = auth.uid() and public.is_approved())
  or public.is_admin_or_super()
  or exists (
    select 1 from public.teacher_batches tb
    where tb.batch_id = public.students.batch_id and tb.teacher_id = auth.uid()
  )
);
