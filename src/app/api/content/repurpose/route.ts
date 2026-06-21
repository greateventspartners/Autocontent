import { NextRequest } from "next/server";
import { requireAuth, requireWorkspace, createServerSupabaseClient } from "@/lib/supabase-server";
import { handleApiError } from "@/lib/errors";
import { repurposeContent } from "@/lib/ai";
import { createAuditLog } from "@/lib/db/audit";
import { createContentItem } from "@/lib/db/content";

const VALID_CHANNELS = [
  "LINKEDIN", "INSTAGRAM", "FACEBOOK", "X", "TIKTOK",
];

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const { workspaceId } = await requireWorkspace();
    const body = await request.json();
    const { brandKitId, longText, channels = VALID_CHANNELS } = body;

    if (!brandKitId) {
      return Response.json({ error: "brandKitId is required" }, { status: 400 });
    }
    if (!longText?.trim()) {
      return Response.json({ error: "longText is required" }, { status: 400 });
    }

    const posts = await repurposeContent(brandKitId, longText, channels);

    const items = [];
    for (const post of posts) {
      const item = await createContentItem(workspaceId, {
        brandKitId,
        title: post.title,
        type: "SOCIAL",
        status: "DRAFT",
        channel: post.channel,
        content: post.content,
        variantA: post.content,
        variantB: "",
        scoreA: 85,
        scoreB: 0,
        brandScore: 80,
        summary: `Recyclé pour ${post.channel}`,
      });
      items.push(item);
    }

    await createAuditLog({
      workspaceId,
      userId,
      action: "content.repurpose",
      entityType: "ContentItem",
      metadata: { count: items.length, channels, brandKitId },
    });

    return Response.json(items, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
