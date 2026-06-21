import { NextRequest } from "next/server";
import { requireAuth, requireWorkspace } from "@/lib/supabase-server";
import { handleApiError } from "@/lib/errors";
import { generateImage } from "@/lib/ai";
import { createAuditLog } from "@/lib/db/audit";
import { rateLimitMiddleware } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const { workspaceId } = await requireWorkspace();

    const rateLimitResponse = rateLimitMiddleware(`generate-image:${userId}`, 10, 60_000);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const { brandKitId, prompt } = body;

    if (!brandKitId) {
      return Response.json({ error: "brandKitId is required" }, { status: 400 });
    }
    if (!prompt?.trim()) {
      return Response.json({ error: "prompt is required" }, { status: 400 });
    }

    const result = await generateImage(brandKitId, prompt);

    if (!result) {
      return Response.json({ error: "Image generation failed. Check GEMINI_API_KEY configuration." }, { status: 500 });
    }

    await createAuditLog({
      workspaceId,
      userId,
      action: "content.generate.image",
      entityType: "Media",
      metadata: { key: result.key, prompt },
    });

    return Response.json(result, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
