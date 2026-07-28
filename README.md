# 🎓 Bano Qabil Learning Management System (LMS)

A modern full-stack Learning Management System designed for educational institutes to manage students, teachers, courses, batches, assignments, attendance, approvals, and academic operations through a centralized digital platform.

Bano Qabil LMS provides a secure and scalable environment with role-based access for **Administrators, Teachers, and Students**, helping institutes move from manual processes to efficient digital management.

---

# 📌 Project Overview

Bano Qabil Learning Management System is a complete academic management solution built to simplify institute operations.

The platform provides a single workspace where administrators, teachers, and students can manage academic activities including:

- Student management
- Teacher management
- Course organization
- Batch management
- Assignment handling
- Attendance tracking
- User approvals
- Academic reporting

The system focuses on providing a clean, modern, and user-friendly experience while maintaining security through authentication, authorization, and database-level access control.

---

# ✨ Features

## 👨‍💼 Admin Features

- Complete institute dashboard
- Student management
- Teacher management
- User approval system
- Course management
- Batch management
- Assignment monitoring
- Attendance overview
- Reports and analytics
- Recent activity tracking
- System settings

---

## 👨‍🎓 Student Features

- Student profile management
- View assigned courses
- View batches
- Access assignments
- Track assignment submissions
- View attendance records
- Monitor academic progress

---

## 👨‍🏫 Teacher Features

- Teacher dashboard
- Manage assigned batches
- Create and manage assignments
- Track student submissions
- Record attendance
- Monitor student performance

---

## 📚 Academic Management

- Course creation and organization
- Batch scheduling
- Student enrollment
- Teacher assignment
- Academic record management

---

## 📝 Assignment Management

- Create assignments
- Assign assignments to batches
- Track submissions
- Monitor pending and completed work

---

## 📅 Attendance Management

- Record student attendance
- Track attendance history
- Calculate attendance percentage
- Monitor student participation

---

# 🛠️ Technologies Used

React 19, TypeScript, Vite, Tailwind CSS, Shadcn/UI, React Router DOM, React Hook Form, TanStack Query, Zustand, Framer Motion, Lucide React, Supabase, PostgreSQL, Supabase Auth, Supabase Storage, Row Level Security (RLS), Supabase Edge Functions

---

# 🏗️ Project Architecture

The project follows a clean feature-based architecture.

```
src/
│
├── api/                   
│   # All Supabase API calls
│   # Components never directly call supabase.*
│
├── components/
│   │
│   ├── ui/
│   │   # shadcn/ui reusable components
│   │   # Button, Input, Dialog, Table, Card
│   │
│   ├── layout/
│   │   # AppShell, Sidebar, Navbar
│   │   # Mobile drawer components
│   │
│   └── shared/
│       # DataTable
│       # EmptyState
│       # ErrorState
│       # ConfirmDialog
│       # FileUpload
│
├── features/
│   │
│   ├── auth/
│   ├── dashboard/
│   ├── students/
│   ├── assignments/
│   ├── attendance/
│   ├── admin/
│   ├── settings/
│   └── notifications/
│
│   # Each feature contains:
│   # pages/
│   # components/
│   # schemas.ts
│
├── hooks/
│   # Custom React hooks
│   # useAuth
│   # useAsync
│   # useDebounce
│
├── lib/
│   # Supabase client
│   # Utility functions
│   # Constants
│
├── routes/
│   # Protected routes
│   # 404 page
│
├── store/
│   # Zustand stores
│   # Authentication state
│   # Theme state
│
├── types/
│   # TypeScript database types
│
└── main.tsx


supabase/

├── schema.sql
│   # Database tables
│   # Enums
│   # Triggers
│   # Helper functions
│
├── policies.sql
│   # Row Level Security policies
│
├── storage.sql
│   # Storage buckets and policies
│
├── seed.sql
│   # Development sample data
│
└── functions/
    └── create-user/
        # Admin user provisioning
        # Secure Edge Function
```

---

# 🗄️ Database Structure

The project uses Supabase PostgreSQL.

Main tables:

```
profiles
 └── User information and roles

students
 └── Student records

teachers
 └── Teacher information

courses
 └── Course management

batches
 └── Batch scheduling

assignments
 └── Assignment management

assignment_submissions
 └── Student submissions

attendance
 └── Attendance records

activity_logs
 └── System activities
```

---

# 🔐 Authentication & Security

Security features:

- Supabase Authentication
- Role-based access control
- Protected routes
- Database Row Level Security (RLS)
- Secure API separation
- Permission-based operations

Supported roles:

```
Admin
Teacher
Student
```

---

# 🖼️ Application Screenshots

## 🏠 Homepage

The homepage introduces the Bano Qabil LMS platform.

Features:

- Bano Qabil branding
- Navigation menu
- Hero section
- Modern grid-pattern background
- Call-to-action buttons

Hero message:

> Empowering institutes with modern academic management

Main heading:

> Bano Qabil Learning Management System

---

## 📖 About Page

The About page explains the platform vision and mission.

Sections:

### Our Mission

Making academic management accessible, organized, and stress-free.

### Our Vision

Helping schools and academies manage complete academic operations digitally.

### Quality Education

Reducing paperwork and improving teacher productivity.

### Student Growth

Providing visibility into:

- Assignments
- Grades
- Attendance

### Career Development

Maintaining structured academic records.

### Digital Learning

Connecting:

- Students
- Teachers
- Administrators

---

## 📞 Contact Page

The contact page provides institute communication options.

Includes:

Contact information:

```
Address:
123 Education Avenue,
Islamabad, Pakistan

Phone:
+92 300 1234567

Email:
hello@banoqabil.example
```

Inquiry form:

- Name
- Email
- Message
- Send Message button

---

## 🔑 Login Page

The login page provides secure user access.

Features:

- Bano Qabil branding
- Email authentication
- Password visibility toggle
- Remember me option
- Forgot password link
- Role-based security message

---

## 📊 Admin Dashboard

The admin dashboard provides complete institute control.

Sidebar:

- Dashboard
- Students
- Teachers
- Manage Users
- Courses
- Batches
- Assignments
- Attendance
- Approvals
- Reports
- Settings

Dashboard sections:

### Student Management

Manage:

- Profiles
- Batches
- Attendance

### Teacher Management

Manage:

- Teachers
- Assignments
- Classroom activities

### Academic Overview

Track:

- Courses
- Batches
- Institute performance

### Recent Activity

Displays:

- User actions
- System updates
- Academic events

---

# ⚙️ Installation & Setup

## Clone Repository

```bash
git clone <repository-url>

cd student-lms
```

---

## Install Dependencies

```bash
npm install
```

---

## Environment Variables

Create `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_url

VITE_SUPABASE_ANON_KEY=your_supabase_key
```

---

## Start Development Server

```bash
npm run dev
```

Application runs on:

```
http://localhost:5173
```

---

# 🚀 Production Build

Create production build:

```bash
npm run build
```

Preview build:

```bash
npm run preview
```

---

# 🌐 Deployment

Recommended platforms:

- Vercel
- Netlify

Before deployment:

- Add environment variables
- Verify Supabase connection
- Test authentication
- Test database policies

---

# ✅ Testing Checklist

Before release:

- [x] Admin login
- [x] Student management
- [x] Teacher management
- [x] Course management
- [x] Batch management
- [x] Assignment workflow
- [x] Attendance tracking
- [x] Protected routes
- [x] Production build

---

# 🔮 Future Improvements

Possible future enhancements:

- Online classes integration
- AI academic assistant
- Parent portal
- Payment management
- Email notifications
- Mobile application
- Advanced analytics dashboard

---

# 👨‍💻 Developer

**Bano Qabil Learning Management System**

Built using:

React + TypeScript + Supabase

A complete digital solution for modern educational institutes.

---

# 📄 License

This project is developed for educational and portfolio purposes.
