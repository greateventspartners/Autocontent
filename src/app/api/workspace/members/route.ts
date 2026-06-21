import { NextRequest } from "next/server";
import { requireAuth, requireWorkspace, createServerSupabaseClient } from "@/lib/supabase-server";
import { handleApiError } from "@/lib/errors";
import { canAdmin } from "@/lib/rbac";
import { workspaceMemberSchema } from "@/lib/validation";

export async function GET() {
  try {
    await requireAuth();
    const { workspaceId } = await requireWorkspace();

    const supabase = await createServerSupabaseClient();
    const { data: members } = await supabase
      .from("workspace_members")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("joined_at", { ascending: false });

    return Response.json(members ?? []);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const { workspaceId } = await requireWorkspace();

    const supabase = await createServerSupabaseClient();
    const { data: currentMember } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .maybeSingle();

    if (!canAdmin(currentMember?.role)) {
      return Response.json({ error: "Only admins can invite members" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = workspaceMemberSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { data: existing } = await supabase
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", parsed.data.email)
      .maybeSingle();

    if (existing) {
      return Response.json({ error: "Member already exists" }, { status: 409 });
    }

    const { data: member, error } = await supabase
      .from("workspace_members")
      .insert({
        workspace_id: workspaceId,
        user_id: parsed.data.email,
        role: parsed.data.role,
      })
      .select()
      .single();

    if (error) throw error;
    return Response.json(member, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const { workspaceId } = await requireWorkspace();
    const memberId = request.nextUrl.searchParams.get("memberId");
    if (!memberId) return Response.json({ error: "memberId required" }, { status: 400 });

    const supabase = await createServerSupabaseClient();
    const { data: currentMember } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .maybeSingle();

    if (!canAdmin(currentMember?.role)) {
      return Response.json({ error: "Only admins can remove members" }, { status: 403 });
    }

    await supabase.from("workspace_members").delete().eq("id", memberId);

    return Response.json({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
