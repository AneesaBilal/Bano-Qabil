import { supabase } from "@/lib/supabase";
import type { UserRole } from "@/types";

export interface SignUpInput {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
}

export async function signUp({ email, password, fullName, role }: SignUpInput) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // provisioned_by_admin is intentionally omitted (defaults to false server-side)
      // so the handle_new_user trigger marks Student/Teacher self-signups 'pending'.
      data: { full_name: fullName, role },
    },
  });
  if (error) throw error;
  return data;
}

/**
 * Thrown when a Student/Teacher account exists but hasn't cleared the admin
 * approval workflow yet. Callers can check `err instanceof ApprovalError` to
 * show a dedicated pending/rejected screen instead of a generic auth error.
 */
export class ApprovalError extends Error {
  status: "pending" | "rejected";
  constructor(status: "pending" | "rejected", message: string) {
    super(message);
    this.name = "ApprovalError";
    this.status = status;
  }
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;

  // Auth succeeded, but Students/Teachers must be admin-approved before they
  // get access — check the profile row before letting the session stand.
  const { data: profile } = await supabase
    .from("profiles")
    .select("approval_status, rejection_reason")
    .eq("id", data.user.id)
    .single();

  if (profile?.approval_status === "pending") {
    await supabase.auth.signOut();
    throw new ApprovalError("pending", "Your account is awaiting administrator approval.");
  }

  if (profile?.approval_status === "rejected") {
    await supabase.auth.signOut();
    const reason = profile.rejection_reason ? ` Reason: ${profile.rejection_reason}` : "";
    throw new ApprovalError("rejected", `Your registration has been rejected. Please contact the administrator.${reason}`);
  }

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function sendPasswordResetEmail(email: string) {
  const redirectTo = `${window.location.origin}/reset-password`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function fetchProfile(userId: string) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (error) throw error;
  return data;
}
