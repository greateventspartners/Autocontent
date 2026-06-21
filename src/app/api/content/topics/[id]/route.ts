import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireWorkspace, createServerSupabaseClient } from "@/lib/supabase-server";
import { handleApiError } from "@/lib/errors";
import { generateTopics } from "@/lib/ai";
import { updateTopicStatus } from "@/lib/db/topics";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { workspaceId } = await requireWorkspace();
    const { id } = await params;
    const body = await req.json();

    const supabase = await createServerSupabaseClient();
    const { data: topic } = await supabase
      .from("topic_suggestions")
      .select("*")
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (!topic) {
      return NextResponse.json({ error: "Topic introuvable" }, { status: 404 });
    }

    const status = body.status;
    if (!status || !["PENDING", "VALIDATED", "USED"].includes(status)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }

    await updateTopicStatus(id, status);

    const updated = await supabase
      .from("topic_suggestions")
      .select("*")
      .eq("id", id)
      .single();

    if (status === "USED") {
      const { data: remaining } = await supabase
        .from("topic_suggestions")
        .select("id")
        .eq("workspace_id", workspaceId)
        .eq("brand_kit_id", topic.brand_kit_id!)
        .eq("status", "VALIDATED");

      if (!remaining?.length) {
        const titles = await generateTopics(topic.brand_kit_id!, 30);
        const now = new Date().toISOString();
        const data = titles.map((title) => ({
          workspace_id: workspaceId,
          brand_kit_id: topic.brand_kit_id,
          title,
          status: "PENDING" as const,
          generated_at: now,
        }));
        await supabase.from("topic_suggestions").insert(data);

        return NextResponse.json({
          updated: updated.data,
          autoRefilled: true,
          newCount: titles.length,
        });
      }
    }

    return NextResponse.json({ updated: updated.data, autoRefilled: false });
  } catch (error) {
    return handleApiError(error);
  }
}
