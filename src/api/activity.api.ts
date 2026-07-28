import { supabase } from "@/lib/supabase";
import type { ActivityLog } from "@/types";

export async function logActivity(
  action: string,
  entityType: string,
  entityId: string | null,
  metadata: Record<string, unknown> = {}
) {
  const { data: userData } = await supabase.auth.getUser();
  const { error } = await supabase.from("activity_logs").insert({
    actor_id: userData.user?.id ?? null,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata,
  });
  // Activity logging failures should never break the primary user action.
  if (error) console.error("Failed to log activity:", error.message);
}

export async function listRecentActivity(limit = 10) {
  const { data, error } = await supabase
    .from("activity_logs")
    .select("*, actor:profiles(*)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as unknown as ActivityLog[];
}
