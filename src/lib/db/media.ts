import { createServerSupabaseClient } from "../supabase-server";

export async function listMedia(workspaceId: string, brandKitId?: string) {
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from("media")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (brandKitId) query = query.eq("brand_kit_id", brandKitId);

  const { data } = await query;
  return data ?? [];
}

export async function createMedia(workspaceId: string, body: {
  brandKitId?: string;
  fileName: string;
  key: string;
  url: string;
  mimeType: string;
  size: number;
}) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("media")
    .insert({
      workspace_id: workspaceId,
      brand_kit_id: body.brandKitId ?? null,
      file_name: body.fileName,
      key: body.key,
      url: body.url,
      mime_type: body.mimeType,
      size: body.size,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteMedia(id: string) {
  const supabase = await createServerSupabaseClient();
  await supabase.from("media").delete().eq("id", id);
}
