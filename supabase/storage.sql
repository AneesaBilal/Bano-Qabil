-- ============================================================================
-- EduManage — Storage buckets & policies
-- Run in Supabase SQL editor AFTER schema.sql and policies.sql
-- ============================================================================

-- Buckets: 'avatars' (public), 'assignments' (private), 'submissions' (private)
insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('assignments', 'assignments', false),
  ('submissions', 'submissions', false)
on conflict (id) do nothing;

-- ---- avatars: anyone authenticated can read; users manage their own folder ----
create policy "avatars_public_read"
on storage.objects for select
using (bucket_id = 'avatars');

create policy "avatars_owner_write"
on storage.objects for insert
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_owner_update"
on storage.objects for update
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_owner_delete"
on storage.objects for delete
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---- assignments: created by admin/teacher, path = {batch_id}/{assignment_id}/filename ----
-- readable by any authenticated user (batch membership enforced at app/query level via the
-- assignments table RLS which already restricts who can discover the file paths)
create policy "assignments_bucket_read"
on storage.objects for select
using (bucket_id = 'assignments' and auth.role() = 'authenticated');

create policy "assignments_bucket_write"
on storage.objects for insert
with check (
  bucket_id = 'assignments'
  and public.is_admin_or_super() or exists (select 1 from public.teachers t where t.id = auth.uid())
);

create policy "assignments_bucket_delete"
on storage.objects for delete
using (bucket_id = 'assignments' and (public.is_admin_or_super() or exists (select 1 from public.teachers t where t.id = auth.uid())));

-- ---- submissions: path = {assignment_id}/{student_id}/filename ----
create policy "submissions_bucket_read"
on storage.objects for select
using (
  bucket_id = 'submissions'
  and (
    (storage.foldername(name))[2] = auth.uid()::text
    or public.is_admin_or_super()
    or exists (select 1 from public.teachers t where t.id = auth.uid())
  )
);

create policy "submissions_bucket_write"
on storage.objects for insert
with check (bucket_id = 'submissions' and (storage.foldername(name))[2] = auth.uid()::text);

create policy "submissions_bucket_delete"
on storage.objects for delete
using (bucket_id = 'submissions' and (storage.foldername(name))[2] = auth.uid()::text or public.is_admin_or_super());
