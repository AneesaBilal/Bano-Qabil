export const APP_NAME = "Bano Qabil";
export const APP_TAGLINE = "Learning Management System";

export const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  teacher: "Teacher",
  student: "Student",
};

export const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  present: "Present",
  absent: "Absent",
  late: "Late",
  leave: "Leave",
};

export const SUBMISSION_STATUS_LABELS: Record<string, string> = {
  not_submitted: "Not Submitted",
  submitted: "Submitted",
  late: "Late",
  graded: "Graded",
};

export const APPROVAL_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export const STORAGE_BUCKETS = {
  avatars: "avatars",
  assignments: "assignments",
  submissions: "submissions",
} as const;

export const ROUTES = {
  landing: "/",
  login: "/login",
  signup: "/signup",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  dashboard: "/dashboard",
  students: "/students",
  teachers: "/teachers",
  courses: "/courses",
  batches: "/batches",
  assignments: "/assignments",
  attendance: "/attendance",
  reports: "/reports",
  approvals: "/approvals",
  notifications: "/notifications",
  settings: "/settings",
} as const;
