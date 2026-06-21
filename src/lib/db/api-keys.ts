import { createServerSupabaseClient } from "../supabase-server";
import crypto from "crypto";

export async function listApiKeys(workspaceId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("api_keys")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function createApiKey(workspaceId: string, label: string) {
  const supabase = await createServerSupabaseClient();
  const key = `pf_${crypto.randomBytes(32).toString("hex")}`;

  const { data, error } = await supabase
    .from("api_keys")
    .insert({ workspace_id: workspaceId, label, key })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteApiKey(id: string) {
  const supabase = await createServerSupabaseClient();
  await supabase.from("api_keys").delete().eq("id", id);
}
