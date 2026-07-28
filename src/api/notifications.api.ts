import { supabase } from "@/lib/supabase";
import type { Notification, NotificationType } from "@/types";

export async function listNotifications(userId: string, unreadOnly = false) {
  let query = supabase.from("notifications").select("*").eq("recipient_id", userId).order("created_at", { ascending: false });
  if (unreadOnly) query = query.eq("is_read", false);
  const { data, error } = await query;
  if (error) throw error;
  return data as Notification[];
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  if (error) throw error;
}

export async function markAllNotificationsRead(userId: string) {
  const { error } = await supabase.from("notifications").update({ is_read: true }).eq("recipient_id", userId).eq("is_read", false);
  if (error) throw error;
}

export async function createNotification(
  recipientId: string,
  title: string,
  message: string,
  type: NotificationType = "general",
  link?: string
) {
  const { error } = await supabase.from("notifications").insert({ recipient_id: recipientId, title, message, type, link });
  if (error) throw error;
}

export async function createNotificationsForBatch(
  batchId: string,
  title: string,
  message: string,
  type: NotificationType,
  link?: string
) {
  const { data: students, error: studentsError } = await supabase.from("students").select("id").eq("batch_id", batchId);
  if (studentsError) throw studentsError;
  if (!students?.length) return;
  const rows = students.map((s) => ({ recipient_id: s.id, title, message, type, link }));
  const { error } = await supabase.from("notifications").insert(rows);
  if (error) throw error;
}
