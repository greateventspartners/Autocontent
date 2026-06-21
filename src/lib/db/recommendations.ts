import { createServerSupabaseClient } from "../supabase-server";

export async function listRecommendations(workspaceId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("recommendations")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function applyRecommendation(id: string) {
  const supabase = await createServerSupabaseClient();
  await supabase
    .from("recommendations")
    .update({ applied: true })
    .eq("id", id);
}
