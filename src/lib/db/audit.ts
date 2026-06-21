import { createServerSupabaseClient } from "../supabase-server";
import type { Database } from "../database.types";

type Json = Database["public"]["Tables"]["audit_logs"]["Insert"]["metadata"];

export async function createAuditLog(params: {
  workspaceId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Json;
}) {
  const supabase = await createServerSupabaseClient();

  await supabase.from("audit_logs").insert({
    workspace_id: params.workspaceId,
    user_id: params.userId,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    metadata: params.metadata ?? null,
  });
}
