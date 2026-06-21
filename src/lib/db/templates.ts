import { createServerSupabaseClient } from "../supabase-server";

export async function listTemplates(workspaceId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("content_templates")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false });
  return data ?? [];
}

export async function getTemplate(id: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("content_templates")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}

export async function createTemplate(workspaceId: string, body: {
  name: string;
  type: string;
  channel: string;
  prompt: string;
  structure?: any;
}) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("content_templates")
    .insert({
      workspace_id: workspaceId,
      name: body.name,
      type: body.type as any,
      channel: body.channel as any,
      prompt: body.prompt,
      structure: body.structure ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTemplate(id: string, body: Partial<{
  name: string;
  type: string;
  channel: string;
  prompt: string;
  structure: any;
}>) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("content_templates")
    .update(body as any)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTemplate(id: string) {
  const supabase = await createServerSupabaseClient();
  await supabase.from("content_templates").delete().eq("id", id);
}
