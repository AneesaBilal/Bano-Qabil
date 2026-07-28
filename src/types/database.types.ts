// Hand-written types mirroring supabase/schema.sql.
// To regenerate automatically from your live schema, run:
//   npx supabase gen types typescript --project-id <ref> > src/types/database.types.ts

export type UserRole = "super_admin" | "admin" | "teacher" | "student";
export type AttendanceStatus = "present" | "absent" | "late" | "leave";
export type SubmissionStatus = "not_submitted" | "submitted" | "late" | "graded";
export type NotificationType =
  | "assignment_created"
  | "assignment_due_soon"
  | "assignment_graded"
  | "submission_received"
  | "attendance_marked"
  | "general";

export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  is_active: boolean;
  approval_status: ApprovalStatus;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  description: string | null;
  duration_months: number | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Batch {
  id: string;
  course_id: string;
  name: string;
  timing: string;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  course?: Course;
}

export interface Teacher {
  id: string;
  employee_id: string | null;
  specialization: string | null;
  joining_date: string | null;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface TeacherBatch {
  teacher_id: string;
  batch_id: string;
  assigned_at: string;
}

export interface Student {
  id: string;
  application_id: string;
  father_name: string | null;
  address: string | null;
  course_id: string | null;
  batch_id: string | null;
  enrollment_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  profile?: Profile;
  course?: Course;
  batch?: Batch;
}

export interface Assignment {
  id: string;
  title: string;
  description: string | null;
  batch_id: string;
  created_by: string;
  due_date: string;
  max_marks: number | null;
  attachment_paths: string[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
  batch?: Batch;
  creator?: Profile;
  submissions?: AssignmentSubmission[];
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  file_paths: string[];
  remarks: string | null;
  status: SubmissionStatus;
  is_late: boolean;
  submitted_at: string | null;
  grade: number | null;
  teacher_feedback: string | null;
  graded_by: string | null;
  graded_at: string | null;
  created_at: string;
  updated_at: string;
  assignment?: Assignment;
  student?: Student;
}

export interface Attendance {
  id: string;
  student_id: string;
  batch_id: string;
  marked_by: string;
  status: AttendanceStatus;
  date: string;
  remarks: string | null;
  created_at: string;
  updated_at: string;
  student?: Student;
}

export interface Notification {
  id: string;
  recipient_id: string;
  title: string;
  message: string;
  type: NotificationType;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  actor?: Profile;
}
