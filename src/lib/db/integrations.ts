import { createServerSupabaseClient } from "../supabase-server";

export async function listIntegrations(workspaceId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("integrations")
    .select("*")
    .eq("workspace_id", workspaceId);
  return data ?? [];
}

export async function upsertIntegration(workspaceId: string, body: {
  channel: string;
  config: Record<string, unknown>;
  enabled?: boolean;
}) {
  const supabase = await createServerSupabaseClient();

  const existing = await supabase
    .from("integrations")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("channel", body.channel as any)
    .maybeSingle();

  if (existing.data) {
    const { data, error } = await supabase
      .from("integrations")
      .update({
        config: body.config as any,
        enabled: body.enabled ?? existing.data.enabled,
      })
      .eq("id", existing.data.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from("integrations")
    .insert({
      workspace_id: workspaceId,
      channel: body.channel as any,
      config: body.config as any,
      enabled: body.enabled ?? false,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
