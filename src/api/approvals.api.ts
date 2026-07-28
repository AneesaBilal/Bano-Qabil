import { supabase } from "@/lib/supabase";
import type { ApprovalStatus, Profile, UserRole } from "@/types";

export interface ApprovalFilters {
  status?: ApprovalStatus | "all";
  role?: Extract<UserRole, "student" | "teacher"> | "all";
  search?: string;
}

/**
 * Lists Student/Teacher profiles for the admin approval queue. Admins and
 * Super Admins are excluded — this workflow only governs Student/Teacher
 * self-registration.
 */
export async function listApprovalRequests(filters: ApprovalFilters = {}): Promise<Profile[]> {
  let query = supabase.from("profiles").select("*").in("role", ["student", "teacher"]).order("created_at", { ascending: false });

  if (filters.status && filters.status !== "all") {
    query = query.eq("approval_status", filters.status);
  }
  if (filters.role && filters.role !== "all") {
    query = query.eq("role", filters.role);
  }
  if (filters.search) {
    query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Profile[];
}

export async function countPendingApprovals(): Promise<number> {
  const { count, error } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .in("role", ["student", "teacher"])
    .eq("approval_status", "pending");
  if (error) throw error;
  return count ?? 0;
}

export async function approveUser(profileId: string, reviewerId: string) {
  const { error } = await supabase
    .from("profiles")
    .update({ approval_status: "approved", rejection_reason: null, reviewed_by: reviewerId, reviewed_at: new Date().toISOString() })
    .eq("id", profileId);
  if (error) throw error;
}

export async function rejectUser(profileId: string, reviewerId: string, reason?: string) {
  const { error } = await supabase
    .from("profiles")
    .update({
      approval_status: "rejected",
      rejection_reason: reason || null,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", profileId);
  if (error) throw error;
}
