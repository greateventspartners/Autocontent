import { createServerSupabaseClient } from "../supabase-server";

export async function listTopics(workspaceId: string, brandKitId?: string) {
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from("topic_suggestions")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("generated_at", { ascending: false });

  if (brandKitId) query = query.eq("brand_kit_id", brandKitId);

  const { data } = await query;
  const topics = data ?? [];

  return {
    topics,
    counts: {
      pending: topics.filter((t) => t.status === "PENDING").length,
      validated: topics.filter((t) => t.status === "VALIDATED").length,
      used: topics.filter((t) => t.status === "USED").length,
    },
  };
}

export async function createTopics(workspaceId: string, brandKitId: string, titles: string[]) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("topic_suggestions").insert(
    titles.map((title) => ({
      workspace_id: workspaceId,
      brand_kit_id: brandKitId,
      title,
    }))
  );

  if (error) throw error;
}

export async function updateTopicStatus(id: string, status: "PENDING" | "VALIDATED" | "USED") {
  const supabase = await createServerSupabaseClient();
  const updates: Record<string, any> = { status };
  if (status === "VALIDATED") updates.validated_at = new Date().toISOString();
  if (status === "USED") updates.used_at = new Date().toISOString();

  await supabase.from("topic_suggestions").update(updates as any).eq("id", id);
}
