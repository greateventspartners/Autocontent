import { createServerSupabaseClient } from "./supabase-server";

export interface ApiKeyAuth {
  type: "api_key";
  workspaceId: string;
  keyId: string;
}

export async function validateApiKey(
  request: Request
): Promise<ApiKeyAuth | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const key = authHeader.slice(7);
  const supabase = await createServerSupabaseClient();

  const { data: apiKey } = await supabase
    .from("api_keys")
    .select("*")
    .eq("key", key)
    .maybeSingle();

  if (!apiKey) return null;

  if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) return null;

  await supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", apiKey.id);

  await supabase.from("api_key_logs").insert({
    api_key_id: apiKey.id,
    workspace_id: apiKey.workspace_id,
    method: request.method,
    path: new URL(request.url).pathname,
    status: 200,
  });

  return {
    type: "api_key",
    workspaceId: apiKey.workspace_id,
    keyId: apiKey.id,
  };
}
