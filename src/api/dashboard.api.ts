import { supabase } from "@/lib/supabase";

export interface AdminDashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  totalBatches: number;
  pendingAssignments: number;
  submittedAssignments: number;
  attendanceRatePercent: number;
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const [
  { count: totalStudents },
  { count: totalTeachers },
  { count: totalCourses },
  { count: totalBatches },
  { count: submittedAssignments },
  { count: pendingAssignments },
] = await Promise.all([
  supabase.from("students").select("*", { count: "exact", head: true }),
  supabase.from("teachers").select("*", { count: "exact", head: true }),
  supabase.from("courses").select("*", { count: "exact", head: true }),
  supabase.from("batches").select("*", { count: "exact", head: true }),
  supabase
    .from("assignment_submissions")
    .select("*", { count: "exact", head: true })
    .in("status", ["submitted", "late", "graded"]),
  supabase
    .from("assignment_submissions")
    .select("*", { count: "exact", head: true })
    .eq("status", "not_submitted"),
]);

  const since = new Date();
  since.setDate(since.getDate() - 30);
  const { data: attendanceRows } = await supabase
    .from("attendance")
    .select("status")
    .gte("date", since.toISOString().slice(0, 10));

  let attendanceRatePercent = 0;
  if (attendanceRows && attendanceRows.length > 0) {
    const presentLike = attendanceRows.filter((r) => r.status === "present" || r.status === "late").length;
    attendanceRatePercent = Math.round((presentLike / attendanceRows.length) * 100);
  }

  return {
    totalStudents: totalStudents ?? 0,
    totalTeachers: totalTeachers ?? 0,
    totalCourses: totalCourses ?? 0,
    totalBatches: totalBatches ?? 0,
    pendingAssignments: pendingAssignments ?? 0,
    submittedAssignments: submittedAssignments ?? 0,
    attendanceRatePercent,
  };
}

export interface TeacherDashboardStats {
  totalClasses: number;
  totalStudents: number;
  activeAssignments: number;
}

export async function getTeacherDashboardStats(teacherId: string): Promise<TeacherDashboardStats> {
  const { data: batches } = await supabase.from("teacher_batches").select("batch_id").eq("teacher_id", teacherId);
  const batchIds = (batches ?? []).map((b) => b.batch_id);

  if (batchIds.length === 0) {
    return { totalClasses: 0, totalStudents: 0, activeAssignments: 0 };
  }

  const [{ count: totalStudents }, { count: activeAssignments }] = await Promise.all([
    supabase.from("students").select("*", { count: "exact", head: true }).in("batch_id", batchIds),
    supabase.from("assignments").select("*", { count: "exact", head: true }).in("batch_id", batchIds),
  ]);

  return {
    totalClasses: batchIds.length,
    totalStudents: totalStudents ?? 0,
    activeAssignments: activeAssignments ?? 0,
  };
}

export interface StudentDashboardStats {
  pendingAssignments: number;
  submittedAssignments: number;
  attendancePercent: number;
}

export async function getStudentDashboardStats(studentId: string): Promise<StudentDashboardStats> {
  const { data: student } = await supabase.from("students").select("batch_id").eq("id", studentId).single();
  if (!student?.batch_id) return { pendingAssignments: 0, submittedAssignments: 0, attendancePercent: 0 };

  const { data: assignments } = await supabase.from("assignments").select("id").eq("batch_id", student.batch_id);
  const assignmentIds = (assignments ?? []).map((a) => a.id);

  const { data: submissions } = await supabase
    .from("assignment_submissions")
    .select("assignment_id, status")
    .eq("student_id", studentId);

  const submittedIds = new Set((submissions ?? []).filter((s) => s.status !== "not_submitted").map((s) => s.assignment_id));
  const submittedAssignments = submittedIds.size;
  const pendingAssignments = assignmentIds.filter((id) => !submittedIds.has(id)).length;

  const { data: attendanceRows } = await supabase.from("attendance").select("status").eq("student_id", studentId);
  let attendancePercent = 0;
  if (attendanceRows && attendanceRows.length > 0) {
    const presentLike = attendanceRows.filter((r) => r.status === "present" || r.status === "late").length;
    attendancePercent = Math.round((presentLike / attendanceRows.length) * 100);
  }

  return { pendingAssignments, submittedAssignments, attendancePercent };
}
