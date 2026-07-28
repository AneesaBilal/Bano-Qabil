import { supabase } from "@/lib/supabase";
import type { Attendance, AttendanceStatus } from "@/types";
import { logActivity } from "./activity.api";

export interface MarkAttendanceEntry {
  student_id: string;
  status: AttendanceStatus;
  remarks?: string;
}

export async function markAttendance(batchId: string, date: string, entries: MarkAttendanceEntry[]) {
  const { data: userData } = await supabase.auth.getUser();
  const markedBy = userData.user?.id;
  if (!markedBy) throw new Error("Not authenticated");

  const rows = entries.map((e) => ({
    student_id: e.student_id,
    batch_id: batchId,
    marked_by: markedBy,
    status: e.status,
    remarks: e.remarks,
    date,
  }));

  const { data, error } = await supabase
    .from("attendance")
    .upsert(rows, { onConflict: "student_id,batch_id,date" })
    .select();
  if (error) throw error;

  await logActivity("attendance.marked", "attendance", null, { batch_id: batchId, date, count: rows.length });
  return data as Attendance[];
}

export async function getAttendanceForBatchDate(batchId: string, date: string) {
  const { data, error } = await supabase
    .from("attendance")
    .select("*, student:students(*, profile:profiles(*))")
    .eq("batch_id", batchId)
    .eq("date", date);
  if (error) throw error;
  return data as unknown as Attendance[];
}

export interface AttendanceReportParams {
  studentId?: string;
  batchId?: string;
  from?: string;
  to?: string;
}

export async function getAttendanceReport(params: AttendanceReportParams) {
  let query = supabase.from("attendance").select("*, student:students(*, profile:profiles(*))").order("date", { ascending: false });
  if (params.studentId) query = query.eq("student_id", params.studentId);
  if (params.batchId) query = query.eq("batch_id", params.batchId);
  if (params.from) query = query.gte("date", params.from);
  if (params.to) query = query.lte("date", params.to);
  const { data, error } = await query;
  if (error) throw error;
  return data as unknown as Attendance[];
}

export function summarizeAttendance(records: Attendance[]) {
  const summary = { present: 0, absent: 0, late: 0, leave: 0, total: records.length };
  for (const r of records) summary[r.status] += 1;
  const percentPresent = summary.total > 0 ? Math.round(((summary.present + summary.late) / summary.total) * 100) : 0;
  return { ...summary, percentPresent };
}
