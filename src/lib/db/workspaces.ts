import { createServerSupabaseClient } from "../supabase-server";

export async function getWorkspaceId(orgId: string | undefined | null, userId: string): Promise<string> {
  if (orgId) return orgId;
  return userId;
}

export async function ensureWorkspace(ownerId: string, name: string) {
  const supabase = await createServerSupabaseClient();

  const { data: existing } = await supabase
    .from("workspaces")
    .select("*")
    .eq("clerk_org_id", ownerId)
    .maybeSingle();

  if (existing) return existing;

  const slug = name.toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 63);

  const { data: workspace, error } = await supabase
    .from("workspaces")
    .insert({ clerk_org_id: ownerId, name, slug })
    .select()
    .single();

  if (error) throw error;

  await supabase.from("subscriptions").insert({
    workspace_id: workspace.id,
    plan: "FREE",
    status: "ACTIVE",
    content_limit: 10,
  });

  return workspace;
}

export async function getWorkspaceByOwnerId(ownerId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("workspaces")
    .select("*")
    .eq("clerk_org_id", ownerId)
    .maybeSingle();
  return data;
}

export async function getWorkspaceByMemberId(userId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: member } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (!member) return null;

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("*")
    .eq("id", member.workspace_id)
    .single();

  return workspace;
}
