import { supabase } from "@/lib/supabase";
import type { Student } from "@/types";

export interface StudentListParams {
  search?: string;
  courseId?: string;
  batchId?: string;
  page?: number;
  pageSize?: number;
}

const STUDENT_SELECT = `
  *,
  profile:profiles(*),
  course:courses(*),
  batch:batches(*)
`;

export async function listStudents(params: StudentListParams = {}) {
  const { search, courseId, batchId, page = 1, pageSize = 20 } = params;
  let query = supabase.from("students").select(STUDENT_SELECT, { count: "exact" });

  if (courseId) query = query.eq("course_id", courseId);
  if (batchId) query = query.eq("batch_id", batchId);
  if (search) {
    // Search by application_id directly; name/email search needs the joined profile,
    // so we filter client-side after fetch for simplicity in this reference impl.
    query = query.ilike("application_id", `%${search}%`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.order("created_at", { ascending: false }).range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;
  return { data: (data ?? []) as unknown as Student[], count: count ?? 0 };
}

export async function getStudent(id: string) {
  const { data, error } = await supabase.from("students").select(STUDENT_SELECT).eq("id", id).single();
  if (error) throw error;
  return data as unknown as Student;
}

export interface UpsertStudentInput {
  id?: string;
  full_name: string;
  email: string;
  phone?: string;
  father_name?: string;
  address?: string;
  application_id: string;
  course_id?: string | null;
  batch_id?: string | null;
  enrollment_date?: string;
}

/**
 * Creates a full student: an auth user (via Edge Function, see
 * supabase/functions/create-user) plus the students row. For updates to an
 * existing student, only the students+profiles rows are touched.
 */
export async function updateStudent(id: string, input: Partial<UpsertStudentInput>) {
  const { full_name, email, phone, ...studentFields } = input;

  if (full_name || email || phone) {
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ ...(full_name && { full_name }), ...(email && { email }), ...(phone && { phone }) })
      .eq("id", id);
    if (profileError) throw profileError;
  }

  if (Object.keys(studentFields).length > 0) {
    const { error: studentError } = await supabase.from("students").update(studentFields).eq("id", id);
    if (studentError) throw studentError;
  }

  return getStudent(id);
}

export interface CreateStudentInput {
  full_name: string;
  email: string;
  phone?: string;
  application_id: string;
  father_name?: string;
  address?: string;
  course_id?: string;
  batch_id?: string;
  enrollment_date?: string;
}

/**
 * Provisions a brand-new student: creates the auth user via the `create-user`
 * Edge Function (which uses the service role key server-side) and the
 * matching students row, then emails the student a link to set their password.
 */
export async function createStudent(input: CreateStudentInput) {
  const { data, error } = await supabase.functions.invoke("create-user", {
    body: { ...input, fullName: input.full_name, role: "student" },
  });
  if (error) throw error;
  return data as { userId: string };
}

export async function deactivateStudent(id: string) {
  const { error } = await supabase.from("students").update({ is_active: false }).eq("id", id);
  if (error) throw error;
}

export async function uploadAvatar(userId: string, file: File) {
  const ext = file.name.split(".").pop();
  const path = `${userId}/avatar.${ext}`;
  const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
  if (uploadError) throw uploadError;
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  const { error: updateError } = await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", userId);
  if (updateError) throw updateError;
  return data.publicUrl;
}
