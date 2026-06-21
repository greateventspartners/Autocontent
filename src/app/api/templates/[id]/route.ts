import { NextRequest } from "next/server";
import { requireAuth, requireWorkspace } from "@/lib/supabase-server";
import { handleApiError } from "@/lib/errors";
import { getTemplate, updateTemplate, deleteTemplate } from "@/lib/db/templates";
import { z } from "zod/v4";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.enum(["SOCIAL", "BLOG", "EMAIL", "AD"]).optional(),
  channel: z.string().min(1).max(50).optional(),
  prompt: z.string().min(1).max(5000).optional(),
  structure: z.any().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { workspaceId } = await requireWorkspace();
    const { id } = await params;

    const template = await getTemplate(id);
    if (!template || template.workspace_id !== workspaceId) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    return Response.json(template);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { workspaceId } = await requireWorkspace();
    const { id } = await params;
    const body = await request.json();

    const existing = await getTemplate(id);
    if (!existing || existing.workspace_id !== workspaceId) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues }, { status: 400 });
    }

    const template = await updateTemplate(id, parsed.data);
    return Response.json(template);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { workspaceId } = await requireWorkspace();
    const { id } = await params;

    const existing = await getTemplate(id);
    if (!existing || existing.workspace_id !== workspaceId) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    await deleteTemplate(id);
    return new Response(null, { status: 204 });
  } catch (err) {
    return handleApiError(err);
  }
}
