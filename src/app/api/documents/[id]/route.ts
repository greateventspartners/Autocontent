import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import type { Prisma } from "@/generated/prisma/client";

async function getUserWorkspaceId(userId: string) {
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId },
  });
  return membership?.workspaceId ?? null;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(request);
  if (!session) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  const workspaceId = await getUserWorkspaceId(session.userId);
  if (!workspaceId) {
    return Response.json({ error: "Aucun workspace trouvé" }, { status: 404 });
  }

  const { id } = await params;
  const document = await prisma.document.findFirst({
    where: { id, workspaceId },
  });

  if (!document) {
    return Response.json({ error: "Document non trouvé" }, { status: 404 });
  }

  return Response.json({ document });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(request);
  if (!session) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  const workspaceId = await getUserWorkspaceId(session.userId);
  if (!workspaceId) {
    return Response.json({ error: "Aucun workspace trouvé" }, { status: 404 });
  }

  const { id } = await params;
  const body = await request.json() as {
    title?: string;
    content?: unknown;
    tags?: string;
    wordCount?: number;
  };

  const document = await prisma.document.findFirst({
    where: { id, workspaceId },
  });

  if (!document) {
    return Response.json({ error: "Document non trouvé" }, { status: 404 });
  }

  const updateData: Prisma.DocumentUpdateInput = {};
  if (body.title !== undefined) updateData.title = body.title;
  if (body.content !== undefined) updateData.content = body.content as Prisma.InputJsonValue;
  if (body.tags !== undefined) updateData.tags = body.tags;
  if (body.wordCount !== undefined) updateData.wordCount = body.wordCount;

  const updated = await prisma.document.update({
    where: { id },
    data: updateData,
  });

  return Response.json({ document: updated });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(request);
  if (!session) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  const workspaceId = await getUserWorkspaceId(session.userId);
  if (!workspaceId) {
    return Response.json({ error: "Aucun workspace trouvé" }, { status: 404 });
  }

  const { id } = await params;
  const document = await prisma.document.findFirst({
    where: { id, workspaceId },
  });

  if (!document) {
    return Response.json({ error: "Document non trouvé" }, { status: 404 });
  }

  await prisma.document.delete({ where: { id } });

  return Response.json({ ok: true });
}
