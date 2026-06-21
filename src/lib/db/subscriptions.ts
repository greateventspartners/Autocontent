import { createServerSupabaseClient } from "../supabase-server";

export async function getSubscription(workspaceId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  return data;
}
