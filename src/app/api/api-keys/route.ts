import { NextRequest } from "next/server";
import { requireAuth, requireWorkspace, createServerSupabaseClient } from "@/lib/supabase-server";
import { handleApiError } from "@/lib/errors";
import { apiKeyCreateSchema } from "@/lib/validation";
import crypto from "crypto";

function generateApiKey(): string {
  return `pf_${crypto.randomBytes(32).toString("hex")}`;
}

export async function GET() {
  try {
    await requireAuth();
    const { workspaceId } = await requireWorkspace();

    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from("api_keys")
      .select("id, label, key, last_used_at, expires_at, created_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    return Response.json(data ?? []);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const { workspaceId } = await requireWorkspace();

    const body = await request.json();
    const parsed = apiKeyCreateSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues }, { status: 400 });
    }

    const rawKey = generateApiKey();
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from("api_keys")
      .insert({
        workspace_id: workspaceId,
        label: parsed.data.label,
        key: rawKey,
        expires_at: parsed.data.expiresAt ? new Date(parsed.data.expiresAt).toISOString() : null,
      })
      .select("id, label, key, expires_at, created_at")
      .single();

    if (error) throw error;
    return Response.json(data, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
