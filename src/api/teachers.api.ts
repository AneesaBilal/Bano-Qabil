import { supabase } from "@/lib/supabase";
import type { Teacher } from "@/types";

const TEACHER_SELECT = `*, profile:profiles(*)`;

export async function listTeachers() {
  const { data, error } = await supabase.from("teachers").select(TEACHER_SELECT).order("created_at", { ascending: false });
  if (error) throw error;
  return data as unknown as Teacher[];
}

export async function getTeacher(id: string) {
  const { data, error } = await supabase.from("teachers").select(TEACHER_SELECT).eq("id", id).single();
  if (error) throw error;
  return data as unknown as Teacher;
}

export interface CreateTeacherInput {
  full_name: string;
  email: string;
  phone?: string;
  employee_id?: string;
  specialization?: string;
}

export async function createTeacher(input: CreateTeacherInput) {
  const { data, error } = await supabase.functions.invoke("create-user", {
    body: { ...input, fullName: input.full_name, role: "teacher" },
  });
  if (error) throw error;
  return data as { userId: string };
}

export async function updateTeacher(id: string, input: Partial<Teacher>) {
  const { data, error } = await supabase.from("teachers").update(input).eq("id", id).select().single();
  if (error) throw error;
  return data as Teacher;
}

export async function deactivateTeacher(id: string) {
  const { error } = await supabase.from("profiles").update({ is_active: false }).eq("id", id);
  if (error) throw error;
}
