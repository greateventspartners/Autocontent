import { createServerSupabaseClient } from "../supabase-server";

export async function listContentItems(workspaceId: string, options?: {
  status?: string;
  channel?: string;
  brandKitId?: string;
  page?: number;
  limit?: number;
}) {
  const supabase = await createServerSupabaseClient();
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 50;

  let query = supabase
    .from("content_items")
    .select("*, brand_kits!inner(name)", { count: "exact" })
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (options?.status) query = query.eq("status", options.status as any);
  if (options?.channel) query = query.eq("channel", options.channel as any);
  if (options?.brandKitId) query = query.eq("brand_kit_id", options.brandKitId as any);

  const { data, count, error } = await query;
  if (error) throw error;

  return { items: data ?? [], total: count ?? 0, page, limit };
}

export async function getContentItem(id: string, workspaceId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("content_items")
    .select("*, brand_kits!inner(name), publication_logs(*)")
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  return data;
}

export async function createContentItem(workspaceId: string, body: {
  brandKitId?: string;
  title: string;
  type?: string;
  status?: string;
  channel?: string;
  content?: string;
  variantA?: string;
  variantB?: string;
  scoreA?: number;
  scoreB?: number;
  brandScore?: number;
  summary?: string;
  scheduledDate?: string | null;
}) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("content_items")
    .insert({
      workspace_id: workspaceId,
      brand_kit_id: body.brandKitId ?? null,
      title: body.title,
      type: (body.type ?? "SOCIAL") as any,
      status: (body.status ?? "DRAFT") as any,
      channel: (body.channel ?? "LINKEDIN") as any,
      content: body.content ?? "",
      variant_a: body.variantA ?? "",
      variant_b: body.variantB ?? "",
      score_a: body.scoreA ?? 0,
      score_b: body.scoreB ?? 0,
      brand_score: body.brandScore ?? 0,
      summary: body.summary ?? null,
      scheduled_date: body.scheduledDate ? new Date(body.scheduledDate).toISOString() : null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateContentItem(id: string, body: Record<string, any>) {
  const supabase = await createServerSupabaseClient();
  const updateData: Record<string, any> = {};

  const mapping: Record<string, string> = {
    title: "title",
    content: "content",
    variantA: "variant_a",
    variantB: "variant_b",
    scoreA: "score_a",
    scoreB: "score_b",
    brandScore: "brand_score",
    summary: "summary",
    status: "status",
    channel: "channel",
    type: "type",
  };

  for (const [key, dbKey] of Object.entries(mapping)) {
    if (body[key] !== undefined) updateData[dbKey] = body[key];
  }

  if (body.scheduledDate !== undefined) {
    updateData.scheduled_date = body.scheduledDate
      ? new Date(body.scheduledDate).toISOString()
      : null;
  }

  const { data, error } = await supabase
    .from("content_items")
    .update(updateData as any)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteContentItem(id: string) {
  const supabase = await createServerSupabaseClient();
  await supabase.from("content_items").delete().eq("id", id);
}

export async function createContentVersion(contentId: string, userId: string, current: {
  title: string;
  content: string;
  variantA: string;
  variantB: string;
  summary: string | null;
}) {
  const supabase = await createServerSupabaseClient();

  const { data: lastVersion } = await supabase
    .from("content_versions")
    .select("version")
    .eq("content_id", contentId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const version = (lastVersion?.version ?? 0) + 1;

  await supabase.from("content_versions").insert({
    content_id: contentId,
    version,
    title: current.title,
    body: current.content,
    variant_a: current.variantA,
    variant_b: current.variantB,
    summary: current.summary,
    created_by: userId,
  });
}

export async function listContentVersions(contentId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("content_versions")
    .select("*")
    .eq("content_id", contentId)
    .order("version", { ascending: false });
  return data ?? [];
}
