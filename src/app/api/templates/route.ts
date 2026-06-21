import { NextRequest } from "next/server";
import { requireAuth, requireWorkspace } from "@/lib/supabase-server";
import { handleApiError } from "@/lib/errors";
import { listTemplates, createTemplate } from "@/lib/db/templates";
import { z } from "zod/v4";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["SOCIAL", "BLOG", "EMAIL", "AD"]),
  channel: z.string().min(1).max(50),
  prompt: z.string().min(1).max(5000),
  structure: z.any().optional(),
});

export async function GET() {
  try {
    await requireAuth();
    const { workspaceId } = await requireWorkspace();

    const templates = await listTemplates(workspaceId);
    return Response.json(templates);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const { workspaceId } = await requireWorkspace();
    const body = await request.json();

    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues }, { status: 400 });
    }

    const template = await createTemplate(workspaceId, parsed.data);
    return Response.json(template, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
