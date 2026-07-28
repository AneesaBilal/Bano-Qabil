-- ============================================================================
-- Optional seed data for development. Run AFTER creating at least one
-- super_admin user through the app's signup flow (or Supabase Auth dashboard),
-- then update the UUID below to match, or just seed courses/batches which
-- have no dependency on a specific user.
-- ============================================================================

insert into public.courses (name, code, description, duration_months) values
  ('Web Development', 'WEB-101', 'Full-stack web development with React & Node.js', 6),
  ('Graphic Designing', 'GD-101', 'Adobe Photoshop, Illustrator & UI/UX fundamentals', 4),
  ('Data Science', 'DS-101', 'Python, statistics, and machine learning fundamentals', 8)
on conflict (code) do nothing;

insert into public.batches (course_id, name, timing, start_date)
select id, 'Morning Batch A', 'Mon-Fri 9:00 AM - 11:00 AM', current_date
from public.courses where code = 'WEB-101'
on conflict do nothing;

insert into public.batches (course_id, name, timing, start_date)
select id, 'Evening Batch B', 'Mon-Fri 6:00 PM - 8:00 PM', current_date
from public.courses where code = 'WEB-101'
on conflict do nothing;
