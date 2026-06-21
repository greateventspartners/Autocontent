import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireWorkspace, createServerSupabaseClient } from "@/lib/supabase-server";
import { handleApiError } from "@/lib/errors";
import { generateTopics } from "@/lib/ai";
import { listTopics, createTopics } from "@/lib/db/topics";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const { workspaceId } = await requireWorkspace();
    const brandKitId = req.nextUrl.searchParams.get("brandKitId") ?? undefined;

    const result = await listTopics(workspaceId, brandKitId);

    return NextResponse.json({ topics: result.topics, counts: result.counts });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth();
    const { workspaceId } = await requireWorkspace();
    const body = await req.json();

    if (!body.brandKitId) {
      return NextResponse.json({ error: "brandKitId requis" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const { data: brandKit } = await supabase
      .from("brand_kits")
      .select("id")
      .eq("id", body.brandKitId)
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (!brandKit) {
      return NextResponse.json({ error: "Brand kit introuvable" }, { status: 404 });
    }

    const titles = await generateTopics(body.brandKitId, body.count ?? 30);
    await createTopics(workspaceId, body.brandKitId, titles);

    return NextResponse.json({ count: titles.length, titles });
  } catch (error) {
    return handleApiError(error);
  }
}
