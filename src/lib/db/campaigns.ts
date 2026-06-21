import { createServerSupabaseClient } from "../supabase-server";

export async function listCampaigns(workspaceId: string) {
  const supabase = await createServerSupabaseClient();

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("*, content_items(count)")
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false });

  return (campaigns ?? []).map((c) => ({
    ...c,
    _count: { contentItems: (c as any).content_items?.[0]?.count ?? 0 },
  }));
}

export async function createCampaign(workspaceId: string, body: {
  name: string;
  color?: string;
  description?: string;
}) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("campaigns")
    .insert({
      workspace_id: workspaceId,
      name: body.name.trim(),
      color: body.color || "#8b5cf6",
      description: body.description || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCampaign(id: string, body: {
  name?: string;
  color?: string;
  description?: string;
}) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("campaigns")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCampaign(id: string) {
  const supabase = await createServerSupabaseClient();
  await supabase.from("campaigns").delete().eq("id", id);
}
