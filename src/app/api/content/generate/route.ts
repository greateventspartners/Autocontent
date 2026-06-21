import { NextRequest } from "next/server";
import { requireAuth, requireWorkspace, createServerSupabaseClient } from "@/lib/supabase-server";
import { handleApiError } from "@/lib/errors";
import { generateContent } from "@/lib/ai";
import { createAuditLog } from "@/lib/db/audit";
import { rateLimitMiddleware } from "@/lib/rate-limit";
import { createContentItem } from "@/lib/db/content";

const VALID_TYPES = ["SOCIAL", "BLOG", "EMAIL", "AD"];

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const { workspaceId } = await requireWorkspace();

    const rateLimitResponse = rateLimitMiddleware(`generate:${userId}`, 20, 60_000);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const { brandKitId, topic, contentType = "SOCIAL", count = 1 } = body;

    if (!brandKitId) {
      return Response.json({ error: "brandKitId is required" }, { status: 400 });
    }
    if (!VALID_TYPES.includes(contentType)) {
      return Response.json({ error: `Invalid contentType. Must be one of: ${VALID_TYPES.join(", ")}` }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (sub && sub.content_used >= sub.content_limit) {
      return Response.json({ error: "Content limit reached. Upgrade to Pro." }, { status: 403 });
    }

    const results: any[] = [];

    for (let i = 0; i < count; i++) {
      const result = await generateContent({
        workspaceId,
        brandKitId,
        topic: count > 1 ? `${topic} (semaine ${i + 1})` : topic,
        contentType,
      });

      const item = await createContentItem(workspaceId, {
        brandKitId,
        title: result.title,
        type: contentType,
        status: "DRAFT",
        channel: "LINKEDIN",
        content: result.variantA,
        variantA: result.variantA,
        variantB: result.variantB,
        scoreA: result.scoreA,
        scoreB: result.scoreB,
        brandScore: result.brandScore,
        summary: result.summary,
        scheduledDate: count > 1
          ? new Date(Date.now() + (i + 1) * 3 * 86400000).toISOString()
          : null,
      });

      results.push(item);
    }

    if (sub) {
      await supabase
        .from("subscriptions")
        .update({ content_used: sub.content_used + results.length })
        .eq("workspace_id", workspaceId);
    }

    await createAuditLog({
      workspaceId,
      userId,
      action: "content.generate",
      entityType: "ContentItem",
      metadata: { count: results.length, contentType, brandKitId },
    });

    return Response.json(results, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
