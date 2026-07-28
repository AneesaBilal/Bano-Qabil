-- ============================================================================
-- EduManage — Student Assignment & Attendance System
-- Supabase SQL Schema (run in Supabase SQL Editor, or via `supabase db push`)
-- ============================================================================
-- Order: extensions -> enums -> tables -> indexes -> functions -> triggers
-- RLS policies live in policies.sql (run this file first, then policies.sql)
-- ============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================================
-- ENUMS
-- ============================================================================

create type user_role as enum ('super_admin', 'admin', 'teacher', 'student');
create type attendance_status as enum ('present', 'absent', 'late', 'leave');
create type submission_status as enum ('not_submitted', 'submitted', 'late', 'graded');
create type notification_type as enum (
  'assignment_created', 'assignment_due_soon', 'assignment_graded',
  'submission_received', 'attendance_marked', 'general'
);

-- ============================================================================
-- PROFILES  (1:1 with auth.users; source of truth for role + basic identity)
-- ============================================================================

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null unique,
  phone text,
  role user_role not null default 'student',
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'One row per authenticated user; drives role-based access.';

-- ============================================================================
-- COURSES
-- ============================================================================

create table public.courses (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  code text not null unique,
  description text,
  duration_months int,
  is_active boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- BATCHES  (a cohort of students within a course)
-- ============================================================================

create table public.batches (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid not null references public.courses (id) on delete cascade,
  name text not null,
  timing text not null,                -- e.g. "Mon-Fri 6:00 PM - 8:00 PM"
  start_date date,
  end_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, name)
);

-- ============================================================================
-- TEACHERS  (extends profiles for role = teacher)
-- ============================================================================

create table public.teachers (
  id uuid primary key references public.profiles (id) on delete cascade,
  employee_id text unique,
  specialization text,
  joining_date date default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Which teacher teaches which batch (many-to-many)
create table public.teacher_batches (
  teacher_id uuid not null references public.teachers (id) on delete cascade,
  batch_id uuid not null references public.batches (id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (teacher_id, batch_id)
);

-- ============================================================================
-- STUDENTS  (extends profiles for role = student)
-- ============================================================================

create table public.students (
  id uuid primary key references public.profiles (id) on delete cascade,
  application_id text not null unique,
  father_name text,
  address text,
  course_id uuid references public.courses (id) on delete set null,
  batch_id uuid references public.batches (id) on delete set null,
  enrollment_date date not null default current_date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_students_batch on public.students (batch_id);
create index idx_students_course on public.students (course_id);

-- ============================================================================
-- ASSIGNMENTS
-- ============================================================================

create table public.assignments (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  batch_id uuid not null references public.batches (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete cascade,
  due_date timestamptz not null,
  max_marks int default 100,
  attachment_paths text[] default '{}',   -- Supabase Storage object paths (pdf/images)
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_assignments_batch on public.assignments (batch_id);
create index idx_assignments_due on public.assignments (due_date);

-- ============================================================================
-- ASSIGNMENT SUBMISSIONS
-- ============================================================================

create table public.assignment_submissions (
  id uuid primary key default uuid_generate_v4(),
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  file_paths text[] default '{}',
  remarks text,
  status submission_status not null default 'not_submitted',
  is_late boolean not null default false,
  submitted_at timestamptz,
  grade numeric(5,2),
  teacher_feedback text,
  graded_by uuid references public.profiles (id) on delete set null,
  graded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assignment_id, student_id)
);

create index idx_submissions_student on public.assignment_submissions (student_id);
create index idx_submissions_assignment on public.assignment_submissions (assignment_id);

-- ============================================================================
-- ATTENDANCE
-- ============================================================================

create table public.attendance (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.students (id) on delete cascade,
  batch_id uuid not null references public.batches (id) on delete cascade,
  marked_by uuid not null references public.profiles (id) on delete cascade,
  status attendance_status not null,
  date date not null default current_date,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, batch_id, date)
);

create index idx_attendance_student on public.attendance (student_id);
create index idx_attendance_batch_date on public.attendance (batch_id, date);

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  message text not null,
  type notification_type not null default 'general',
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_notifications_recipient on public.notifications (recipient_id, is_read);

-- ============================================================================
-- ACTIVITY LOGS  (audit trail for admin "Recent Activity")
-- ============================================================================

create table public.activity_logs (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,              -- e.g. 'assignment.created', 'attendance.marked'
  entity_type text not null,         -- e.g. 'assignment', 'student'
  entity_id uuid,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

create index idx_activity_logs_created on public.activity_logs (created_at desc);

-- ============================================================================
-- updated_at trigger helper
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger trg_courses_updated before update on public.courses for each row execute function public.set_updated_at();
create trigger trg_batches_updated before update on public.batches for each row execute function public.set_updated_at();
create trigger trg_teachers_updated before update on public.teachers for each row execute function public.set_updated_at();
create trigger trg_students_updated before update on public.students for each row execute function public.set_updated_at();
create trigger trg_assignments_updated before update on public.assignments for each row execute function public.set_updated_at();
create trigger trg_submissions_updated before update on public.assignment_submissions for each row execute function public.set_updated_at();
create trigger trg_attendance_updated before update on public.attendance for each row execute function public.set_updated_at();

-- ============================================================================
-- Auto-create a profile row when a new auth user signs up
-- Role & full_name are read from raw_user_meta_data set at signup time.
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'student')
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Auto-mark late submissions & set submitted_at
-- ============================================================================

create or replace function public.handle_submission_insert_update()
returns trigger as $$
declare
  v_due timestamptz;
begin
  select due_date into v_due from public.assignments where id = new.assignment_id;

  if new.status in ('submitted', 'late') and new.submitted_at is null then
    new.submitted_at := now();
  end if;

  if new.submitted_at is not null and v_due is not null and new.submitted_at > v_due then
    new.is_late := true;
    if new.status = 'submitted' then
      new.status := 'late';
    end if;
  end if;

  return new;
end;
$$ language plpgsql;

create trigger trg_submission_late_check
  before insert or update on public.assignment_submissions
  for each row execute function public.handle_submission_insert_update();

-- ============================================================================
-- Helper: current user's role (used heavily by RLS policies)
-- ============================================================================

create or replace function public.current_role()
returns user_role as $$
  select role from public.profiles where id = auth.uid();
$$ language sql stable security definer set search_path = public;

create or replace function public.is_admin_or_super()
returns boolean as $$
  select public.current_role() in ('admin', 'super_admin');
$$ language sql stable security definer set search_path = public;
