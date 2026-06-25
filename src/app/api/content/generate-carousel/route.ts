import { NextRequest } from "next/server";
import { requireAuth, requireWorkspace } from "@/lib/supabase-server";
import { handleApiError } from "@/lib/errors";
import { generateCarousel } from "@/lib/ai";
import { createAuditLog } from "@/lib/db/audit";
import { rateLimitMiddleware } from "@/lib/rate-limit";

const VALID_CHANNELS = ["LINKEDIN", "INSTAGRAM"];

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const { workspaceId } = await requireWorkspace();

    const rateLimitResponse = rateLimitMiddleware(`carousel:${userId}`, 10, 60_000);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const { brandKitId, topic, channel = "LINKEDIN", slideCount = 6 } = body;

    if (!brandKitId) {
      return Response.json({ error: "brandKitId is required" }, { status: 400 });
    }
    if (!VALID_CHANNELS.includes(channel)) {
      return Response.json({ error: `Invalid channel. Must be one of: ${VALID_CHANNELS.join(", ")}` }, { status: 400 });
    }
    if (slideCount < 3 || slideCount > 15) {
      return Response.json({ error: "slideCount must be between 3 and 15" }, { status: 400 });
    }

    const result = await generateCarousel(brandKitId, topic, channel, slideCount);

    if (!result) {
      return Response.json({ error: "Failed to generate carousel" }, { status: 500 });
    }

    await createAuditLog({
      workspaceId,
      userId,
      action: "carousel.generate",
      entityType: "Carousel",
      metadata: { channel, slideCount, brandKitId, topic },
    });

    return Response.json(result, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
