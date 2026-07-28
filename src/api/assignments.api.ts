import { supabase } from "@/lib/supabase";
import type { Assignment, AssignmentSubmission, SubmissionStatus } from "@/types";
import { logActivity } from "./activity.api";

const ASSIGNMENT_SELECT = `*, batch:batches(*, course:courses(*)), creator:profiles!assignments_created_by_fkey(*)`;

export interface AssignmentListParams {
  batchId?: string;
  createdBy?: string;
}

export async function listAssignments(params: AssignmentListParams = {}) {
  let query = supabase.from("assignments").select(ASSIGNMENT_SELECT).order("due_date", { ascending: true });
  if (params.batchId) query = query.eq("batch_id", params.batchId);
  if (params.createdBy) query = query.eq("created_by", params.createdBy);
  const { data, error } = await query;
  if (error) throw error;
  return data as unknown as Assignment[];
}

export async function getAssignment(id: string) {
  const { data, error } = await supabase.from("assignments").select(ASSIGNMENT_SELECT).eq("id", id).single();
  if (error) throw error;
  return data as unknown as Assignment;
}

export interface CreateAssignmentInput {
  title: string;
  description?: string;
  batch_id: string;
  due_date: string;
  max_marks?: number;
  files?: File[];
}

export async function createAssignment(input: CreateAssignmentInput) {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error("Not authenticated");

  const { data: assignment, error } = await supabase
    .from("assignments")
    .insert({
      title: input.title,
      description: input.description,
      batch_id: input.batch_id,
      due_date: input.due_date,
      max_marks: input.max_marks ?? 100,
      created_by: userId,
    })
    .select()
    .single();
  if (error) throw error;

  const paths: string[] = [];
  if (input.files?.length) {
    for (const file of input.files) {
      const path = `${input.batch_id}/${assignment.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("assignments").upload(path, file);
      if (uploadError) throw uploadError;
      paths.push(path);
    }
    const { error: updateError } = await supabase
      .from("assignments")
      .update({ attachment_paths: paths })
      .eq("id", assignment.id);
    if (updateError) throw updateError;
  }

  await logActivity("assignment.created", "assignment", assignment.id, { title: input.title });

  return assignment as Assignment;
}

export async function updateAssignment(id: string, input: Partial<CreateAssignmentInput>) {
  const { files, ...rest } = input;
  const { data, error } = await supabase.from("assignments").update(rest).eq("id", id).select().single();
  if (error) throw error;

  if (files?.length) {
    const paths: string[] = [...(data.attachment_paths ?? [])];
    for (const file of files) {
      const path = `${data.batch_id}/${id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("assignments").upload(path, file);
      if (uploadError) throw uploadError;
      paths.push(path);
    }
    await supabase.from("assignments").update({ attachment_paths: paths }).eq("id", id);
  }

  await logActivity("assignment.updated", "assignment", id, {});
  return data as Assignment;
}

export async function deleteAssignment(id: string) {
  const { error } = await supabase.from("assignments").delete().eq("id", id);
  if (error) throw error;
  await logActivity("assignment.deleted", "assignment", id, {});
}

export function getAssignmentFileUrl(path: string) {
  const { data } = supabase.storage.from("assignments").createSignedUrl(path, 60 * 60);
  return data;
}

export async function getSignedAssignmentUrl(path: string) {
  const { data, error } = await supabase.storage.from("assignments").createSignedUrl(path, 60 * 60);
  if (error) throw error;
  return data.signedUrl;
}

// ---------------------------------------------------------------------------
// Submissions
// ---------------------------------------------------------------------------

const SUBMISSION_SELECT = `*, assignment:assignments(*), student:students(*, profile:profiles(*))`;

export async function listSubmissionsForAssignment(assignmentId: string) {
  const { data, error } = await supabase
    .from("assignment_submissions")
    .select(SUBMISSION_SELECT)
    .eq("assignment_id", assignmentId);
  if (error) throw error;
  return data as unknown as AssignmentSubmission[];
}

export async function listSubmissionsForStudent(studentId: string) {
  const { data, error } = await supabase
    .from("assignment_submissions")
    .select(SUBMISSION_SELECT)
    .eq("student_id", studentId);
  if (error) throw error;
  return data as unknown as AssignmentSubmission[];
}

export async function getSubmission(assignmentId: string, studentId: string) {
  const { data, error } = await supabase
    .from("assignment_submissions")
    .select(SUBMISSION_SELECT)
    .eq("assignment_id", assignmentId)
    .eq("student_id", studentId)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as AssignmentSubmission | null;
}

export interface SubmitAssignmentInput {
  assignmentId: string;
  studentId: string;
  remarks?: string;
  files: File[];
}

export async function submitAssignment(input: SubmitAssignmentInput) {
  const paths: string[] = [];
  for (const file of input.files) {
    const path = `${input.assignmentId}/${input.studentId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("submissions").upload(path, file);
    if (uploadError) throw uploadError;
    paths.push(path);
  }

  const { data, error } = await supabase
    .from("assignment_submissions")
    .upsert(
      {
        assignment_id: input.assignmentId,
        student_id: input.studentId,
        file_paths: paths,
        remarks: input.remarks,
        status: "submitted" as SubmissionStatus,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: "assignment_id,student_id" }
    )
    .select()
    .single();
  if (error) throw error;

  await logActivity("submission.created", "assignment_submission", data.id, { assignment_id: input.assignmentId });
  return data as AssignmentSubmission;
}

export async function gradeSubmission(id: string, grade: number, feedback?: string) {
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("assignment_submissions")
    .update({
      grade,
      teacher_feedback: feedback,
      status: "graded" as SubmissionStatus,
      graded_by: userData.user?.id,
      graded_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as AssignmentSubmission;
}

export async function getSignedSubmissionUrl(path: string) {
  const { data, error } = await supabase.storage.from("submissions").createSignedUrl(path, 60 * 60);
  if (error) throw error;
  return data.signedUrl;
}
