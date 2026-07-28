-- ============================================================================
-- EduManage — Row Level Security Policies
-- Run AFTER schema.sql
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.batches enable row level security;
alter table public.teachers enable row level security;
alter table public.teacher_batches enable row level security;
alter table public.students enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_submissions enable row level security;
alter table public.attendance enable row level security;
alter table public.notifications enable row level security;
alter table public.activity_logs enable row level security;

-- ============================================================================
-- PROFILES
-- ============================================================================

create policy "profiles_select_own_or_staff"
on public.profiles for select
using (
  id = auth.uid() or public.is_admin_or_super()
  or exists ( -- teachers can see students in their batches
    select 1 from public.students s
    join public.teacher_batches tb on tb.batch_id = s.batch_id
    where s.id = public.profiles.id and tb.teacher_id = auth.uid()
  )
);

create policy "profiles_update_own"
on public.profiles for update
using (id = auth.uid() or public.is_admin_or_super())
with check (id = auth.uid() or public.is_admin_or_super());

create policy "profiles_insert_admin"
on public.profiles for insert
with check (public.is_admin_or_super() or id = auth.uid());

create policy "profiles_delete_super_admin"
on public.profiles for delete
using (public.current_role() = 'super_admin');

-- ============================================================================
-- COURSES  (read: any authenticated user; write: admin/super_admin)
-- ============================================================================

create policy "courses_select_all_authenticated"
on public.courses for select
using (auth.role() = 'authenticated');

create policy "courses_write_admin"
on public.courses for insert with check (public.is_admin_or_super());

create policy "courses_update_admin"
on public.courses for update using (public.is_admin_or_super());

create policy "courses_delete_admin"
on public.courses for delete using (public.is_admin_or_super());

-- ============================================================================
-- BATCHES
-- ============================================================================

create policy "batches_select_all_authenticated"
on public.batches for select
using (auth.role() = 'authenticated');

create policy "batches_write_admin"
on public.batches for insert with check (public.is_admin_or_super());

create policy "batches_update_admin"
on public.batches for update using (public.is_admin_or_super());

create policy "batches_delete_admin"
on public.batches for delete using (public.is_admin_or_super());

-- ============================================================================
-- TEACHERS
-- ============================================================================

create policy "teachers_select_all_authenticated"
on public.teachers for select
using (auth.role() = 'authenticated');

create policy "teachers_write_admin"
on public.teachers for insert with check (public.is_admin_or_super());

create policy "teachers_update_self_or_admin"
on public.teachers for update
using (id = auth.uid() or public.is_admin_or_super());

create policy "teachers_delete_admin"
on public.teachers for delete using (public.is_admin_or_super());

create policy "teacher_batches_select_all_authenticated"
on public.teacher_batches for select
using (auth.role() = 'authenticated');

create policy "teacher_batches_write_admin"
on public.teacher_batches for insert with check (public.is_admin_or_super());

create policy "teacher_batches_delete_admin"
on public.teacher_batches for delete using (public.is_admin_or_super());

-- ============================================================================
-- STUDENTS
-- ============================================================================

create policy "students_select_self_staff_or_batch_teacher"
on public.students for select
using (
  id = auth.uid()
  or public.is_admin_or_super()
  or exists (
    select 1 from public.teacher_batches tb
    where tb.batch_id = public.students.batch_id and tb.teacher_id = auth.uid()
  )
);

create policy "students_write_admin"
on public.students for insert with check (public.is_admin_or_super());

create policy "students_update_self_or_admin"
on public.students for update
using (id = auth.uid() or public.is_admin_or_super());

create policy "students_delete_admin"
on public.students for delete using (public.is_admin_or_super());

-- ============================================================================
-- ASSIGNMENTS
-- ============================================================================

create policy "assignments_select_admin_teacher_or_batch_student"
on public.assignments for select
using (
  public.is_admin_or_super()
  or created_by = auth.uid()
  or exists (
    select 1 from public.teacher_batches tb
    where tb.batch_id = public.assignments.batch_id and tb.teacher_id = auth.uid()
  )
  or exists (
    select 1 from public.students s
    where s.id = auth.uid() and s.batch_id = public.assignments.batch_id
  )
);

create policy "assignments_insert_admin_or_teacher"
on public.assignments for insert
with check (
  public.is_admin_or_super()
  or (
    public.current_role() = 'teacher'
    and exists (
      select 1 from public.teacher_batches tb
      where tb.batch_id = public.assignments.batch_id and tb.teacher_id = auth.uid()
    )
  )
);

create policy "assignments_update_owner_or_admin"
on public.assignments for update
using (created_by = auth.uid() or public.is_admin_or_super());

create policy "assignments_delete_owner_or_admin"
on public.assignments for delete
using (created_by = auth.uid() or public.is_admin_or_super());

-- ============================================================================
-- ASSIGNMENT SUBMISSIONS
-- ============================================================================

create policy "submissions_select_owner_staff"
on public.assignment_submissions for select
using (
  student_id = auth.uid()
  or public.is_admin_or_super()
  or exists (
    select 1 from public.assignments a
    join public.teacher_batches tb on tb.batch_id = a.batch_id
    where a.id = public.assignment_submissions.assignment_id and tb.teacher_id = auth.uid()
  )
);

create policy "submissions_insert_student_self"
on public.assignment_submissions for insert
with check (student_id = auth.uid() or public.is_admin_or_super());

create policy "submissions_update_student_self_or_grader"
on public.assignment_submissions for update
using (
  student_id = auth.uid()
  or public.is_admin_or_super()
  or exists (
    select 1 from public.assignments a
    join public.teacher_batches tb on tb.batch_id = a.batch_id
    where a.id = public.assignment_submissions.assignment_id and tb.teacher_id = auth.uid()
  )
);

create policy "submissions_delete_admin"
on public.assignment_submissions for delete using (public.is_admin_or_super());

-- ============================================================================
-- ATTENDANCE
-- ============================================================================

create policy "attendance_select_owner_staff"
on public.attendance for select
using (
  student_id = auth.uid()
  or public.is_admin_or_super()
  or exists (
    select 1 from public.teacher_batches tb
    where tb.batch_id = public.attendance.batch_id and tb.teacher_id = auth.uid()
  )
);

create policy "attendance_insert_teacher_or_admin"
on public.attendance for insert
with check (
  public.is_admin_or_super()
  or exists (
    select 1 from public.teacher_batches tb
    where tb.batch_id = public.attendance.batch_id and tb.teacher_id = auth.uid()
  )
);

create policy "attendance_update_teacher_or_admin"
on public.attendance for update
using (
  public.is_admin_or_super()
  or exists (
    select 1 from public.teacher_batches tb
    where tb.batch_id = public.attendance.batch_id and tb.teacher_id = auth.uid()
  )
);

create policy "attendance_delete_admin"
on public.attendance for delete using (public.is_admin_or_super());

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

create policy "notifications_select_own"
on public.notifications for select
using (recipient_id = auth.uid() or public.is_admin_or_super());

create policy "notifications_insert_staff"
on public.notifications for insert
with check (public.is_admin_or_super() or public.current_role() = 'teacher' or recipient_id = auth.uid());

create policy "notifications_update_own"
on public.notifications for update
using (recipient_id = auth.uid() or public.is_admin_or_super());

create policy "notifications_delete_own"
on public.notifications for delete
using (recipient_id = auth.uid() or public.is_admin_or_super());

-- ============================================================================
-- ACTIVITY LOGS  (write: any authenticated action; read: admin only)
-- ============================================================================

create policy "activity_logs_select_admin"
on public.activity_logs for select using (public.is_admin_or_super());

create policy "activity_logs_insert_authenticated"
on public.activity_logs for insert with check (auth.role() = 'authenticated');
