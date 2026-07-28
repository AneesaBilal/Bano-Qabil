# Bano Qabil — Learning Management System

A production-ready full-stack web application for managing student assignments
and attendance at an educational institute, built with React + Vite + TypeScript,
Tailwind CSS, shadcn/ui, Supabase, and deployable on Vercel.

## Tech Stack

- **React 18 + Vite + TypeScript** — app shell and build tooling
- **Tailwind CSS + shadcn/ui (Radix primitives)** — styling and accessible components
- **React Router** — routing and role-based route protection
- **React Hook Form + Zod** — form state and validation
- **Zustand** — auth/theme global state
- **TanStack Table** — data tables (search, sort, pagination)
- **Supabase** — Postgres database, Auth, Storage, Edge Functions

## Folder Structure

```
src/
  api/            # All Supabase calls live here — never call supabase.* from a component
  components/
    ui/           # shadcn/ui primitives (button, input, dialog, table, ...)
    layout/       # AppShell, Sidebar, Navbar, Sheet (mobile drawer)
    shared/       # DataTable, EmptyState, ErrorState, ConfirmDialog, FileUpload, ...
  features/       # One folder per domain: auth, dashboard, students, assignments,
                  # attendance, admin, settings, notifications. Each has pages/
                  # and components/ subfolders and, where relevant, schemas.ts.
  hooks/          # useAuth, useAsync, useDebounce
  lib/            # supabase client, cn(), formatters, constants
  routes/         # ProtectedRoute + 404 page
  store/          # Zustand stores (auth, theme)
  types/          # Hand-written types mirroring the SQL schema
supabase/
  schema.sql      # Tables, enums, triggers, helper functions
  policies.sql    # Row Level Security policies
  storage.sql     # Storage buckets + policies
  seed.sql        # Optional sample courses/batches for local dev
  functions/
    create-user/  # Edge Function: admin-only user provisioning (service role key)
```

This structure intentionally keeps all Supabase/browser-only calls inside `src/api`
and `src/lib`, and keeps `src/features/*` free of platform-specific code, so the
same features can later be reused in a Tauri or Electron desktop shell — only
`src/lib/supabase.ts` and `main.tsx`/`index.html` would need platform-specific
adjustments.

## 1. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run the following files **in order**:
   1. `supabase/schema.sql`
   2. `supabase/policies.sql`
   3. `supabase/storage.sql`
   4. *(optional)* `supabase/seed.sql` for sample courses/batches
   5. `supabase/approval_workflow.sql` — adds the Admin approval workflow
      (Student/Teacher self-registrations start `pending` and can't sign in
      until an Admin approves them from **Approvals** in the sidebar)
3. In **Authentication → URL Configuration**, set:
   - Site URL: your deployed URL (or `http://localhost:5173` for local dev)
   - Redirect URLs: add `http://localhost:5173/reset-password` and your
     production `https://yourdomain.com/reset-password`
4. In **Authentication → Providers**, ensure Email is enabled. Disable "Confirm
   email" only if you want instant sign-in during local testing.
5. Create your first **Super Admin**:
   - Sign up normally through the app (role = Admin, since Super Admin isn't
     self-selectable), then in the SQL Editor run:
     ```sql
     update public.profiles set role = 'super_admin' where email = 'you@example.com';
     ```

### Deploying the Edge Function

The `create-user` function lets Admins provision Teacher/Student accounts
(with the service role key, never exposed to the browser):

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase functions deploy create-user
```

It reads `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`
from the function's environment — these are provided automatically by Supabase
for deployed Edge Functions.

### Storage Buckets

`storage.sql` creates three buckets:
- `avatars` (public) — profile pictures
- `assignments` (private) — teacher-uploaded assignment files
- `submissions` (private) — student-uploaded submission files

## 2. Local Development

```bash
npm install
cp .env.example .env      # then fill in your Supabase URL + anon key
npm run dev
```

The app runs at `http://localhost:5173`.

### Environment Variables

| Variable                  | Description                                  |
|---------------------------|-----------------------------------------------|
| `VITE_SUPABASE_URL`       | Your Supabase project URL                     |
| `VITE_SUPABASE_ANON_KEY`  | Your Supabase anon/public API key             |

Never put the service role key in the frontend `.env` — it's only used inside
the Edge Function, server-side.

## 3. Build

```bash
npm run build     # type-checks then builds to dist/
npm run preview   # preview the production build locally
```

## 4. Deploy to Vercel

1. Push this repo to GitHub/GitLab/Bitbucket.
2. In Vercel, **Add New Project** → import the repo. Vercel auto-detects Vite
   (via `vercel.json`, which also adds an SPA rewrite so client-side routes
   like `/students/123` don't 404 on refresh).
3. Add environment variables in **Project Settings → Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy. Update your Supabase Auth redirect URLs to include the new
   `https://<project>.vercel.app/reset-password` URL.

## Roles & Access

| Role         | Can do                                                                 |
|--------------|-------------------------------------------------------------------------|
| Super Admin  | Everything Admin can, plus change any user's role, delete profiles     |
| Admin        | Manage users, courses, batches, teachers, students; view all reports   |
| Teacher      | Manage assignments/attendance for their assigned batches only          |
| Student      | View own profile, assignments, submit work, view own attendance        |

Route access is enforced in two layers:
1. **UI**: `src/routes/ProtectedRoute.tsx` redirects unauthenticated users to
   `/login` and unauthorized roles to `/dashboard`.
2. **Database**: `supabase/policies.sql` enforces the same rules at the row
   level via Postgres RLS — so even a modified frontend can't bypass access
   control.

## Key Modules

- **Auth** — login, signup, forgot/reset password, all via Supabase Auth.
- **Dashboards** — role-specific stats pulled live from Postgres (`src/api/dashboard.api.ts`).
- **Students** — profile fields (name, father's name, email, phone, address,
  application ID, course, batch, timing, enrollment date, profile picture).
- **Assignments** — create/edit/delete (Admin/Teacher), PDF/image upload,
  due dates; students view, download, submit, add remarks; late submissions
  auto-flagged by a Postgres trigger comparing `submitted_at` to `due_date`.
- **Attendance** — Present/Absent/Late/Leave, marked per batch/date by
  teachers, with exportable reports.
- **Admin** — manage users/roles, courses, batches (with teacher assignment),
  reports with CSV export.
- **Settings** — profile edit, avatar upload, password change, dark mode,
  notification preferences.

## Notes on Production Readiness

- All data access goes through `src/api/*.ts` — no direct Supabase calls in
  components — so swapping the backend later only touches this layer.
- RLS policies are the source of truth for authorization; the UI role checks
  are a UX convenience, not the security boundary.
- File uploads are validated client-side (size/type) and stored under
  per-user/per-assignment paths so storage policies can scope access.
- Loading skeletons, empty states, and error states with retry are used
  consistently via `src/components/shared`.
