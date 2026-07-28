import { supabase } from "@/lib/supabase";
import type { Batch, Course } from "@/types";

export async function listCourses() {
  const { data, error } = await supabase.from("courses").select("*").order("name");
  if (error) throw error;
  return data as Course[];
}

export async function createCourse(input: Pick<Course, "name" | "code" | "description" | "duration_months">) {
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("courses")
    .insert({ ...input, created_by: userData.user?.id })
    .select()
    .single();
  if (error) throw error;
  return data as Course;
}

export async function updateCourse(id: string, input: Partial<Course>) {
  const { data, error } = await supabase.from("courses").update(input).eq("id", id).select().single();
  if (error) throw error;
  return data as Course;
}

export async function deleteCourse(id: string) {
  const { error } = await supabase.from("courses").delete().eq("id", id);
  if (error) throw error;
}

export async function listBatches(courseId?: string) {
  let query = supabase.from("batches").select("*, course:courses(*)").order("name");
  if (courseId) query = query.eq("course_id", courseId);
  const { data, error } = await query;
  if (error) throw error;
  return data as unknown as Batch[];
}

export async function createBatch(input: Pick<Batch, "course_id" | "name" | "timing" | "start_date" | "end_date">) {
  const { data, error } = await supabase.from("batches").insert(input).select().single();
  if (error) throw error;
  return data as Batch;
}

export async function updateBatch(id: string, input: Partial<Batch>) {
  const { data, error } = await supabase.from("batches").update(input).eq("id", id).select().single();
  if (error) throw error;
  return data as Batch;
}

export async function deleteBatch(id: string) {
  const { error } = await supabase.from("batches").delete().eq("id", id);
  if (error) throw error;
}

export async function assignTeacherToBatch(teacherId: string, batchId: string) {
  const { error } = await supabase.from("teacher_batches").insert({ teacher_id: teacherId, batch_id: batchId });
  if (error) throw error;
}

export async function unassignTeacherFromBatch(teacherId: string, batchId: string) {
  const { error } = await supabase
    .from("teacher_batches")
    .delete()
    .eq("teacher_id", teacherId)
    .eq("batch_id", batchId);
  if (error) throw error;
}

export async function listBatchesForTeacher(teacherId: string) {
  const { data, error } = await supabase
    .from("teacher_batches")
    .select("batch:batches(*, course:courses(*))")
    .eq("teacher_id", teacherId);
  if (error) throw error;
  return (data ?? []).map((row) => row.batch) as unknown as Batch[];
}
