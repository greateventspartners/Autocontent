import { NextRequest } from "next/server";
import { requireAuth, requireWorkspace, createServerSupabaseClient } from "@/lib/supabase-server";
import { handleApiError } from "@/lib/errors";
import { generateMultiChannel } from "@/lib/ai";
import { createAuditLog } from "@/lib/db/audit";
import { rateLimitMiddleware } from "@/lib/rate-limit";
import { createContentItem } from "@/lib/db/content";

const VALID_CHANNELS = [
  "LINKEDIN", "INSTAGRAM", "FACEBOOK", "X", "TIKTOK",
];

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const { workspaceId } = await requireWorkspace();

    const rateLimitResponse = rateLimitMiddleware(`generate:${userId}`, 10, 60_000);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const { brandKitId, topic, channels = VALID_CHANNELS } = body;

    if (!brandKitId) {
      return Response.json({ error: "brandKitId is required" }, { status: 400 });
    }
    if (!topic?.trim()) {
      return Response.json({ error: "topic is required" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (sub && sub.content_used + channels.length > sub.content_limit) {
      return Response.json(
        { error: "Content limit reached. Upgrade to Pro." },
        { status: 403 }
      );
    }

    const posts = await generateMultiChannel(brandKitId, topic, channels);

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
        summary: `Post ${post.channel} sur: ${topic}`,
      });
      items.push(item);
    }

    if (sub) {
      await supabase
        .from("subscriptions")
        .update({ content_used: sub.content_used + items.length })
        .eq("workspace_id", workspaceId);
    }

    await createAuditLog({
      workspaceId,
      userId,
      action: "content.generate.multi",
      entityType: "ContentItem",
      metadata: { count: items.length, channels, brandKitId },
    });

    return Response.json(items, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
