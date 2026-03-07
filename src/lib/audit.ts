import type { SupabaseClient } from "@supabase/supabase-js";

type AuditAction = "create" | "update" | "delete";

export async function logAudit(
  supabase: SupabaseClient,
  userId: string,
  action: AuditAction,
  entityType: string,
  entityId: number,
  oldValues?: Record<string, unknown> | null,
  newValues?: Record<string, unknown> | null
) {
  try {
    await supabase.from("audit_logs").insert([
      {
        user_id: userId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        old_values: oldValues || null,
        new_values: newValues || null,
      },
    ]);
  } catch {
    // Audit logging should never block the main operation
  }
}
