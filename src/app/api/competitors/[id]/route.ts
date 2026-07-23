import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

async function getUserWorkspaceId(userId: string) {
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId },
  });
  return membership?.workspaceId ?? null;
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession(request);
  if (!session) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  const workspaceId = await getUserWorkspaceId(session.userId);
  if (!workspaceId) {
    return Response.json({ error: "Aucun workspace trouvé" }, { status: 404 });
  }

  const { id } = await params;
  const competitor = await prisma.competitor.findFirst({
    where: { id, workspaceId },
  });

  if (!competitor) {
    return Response.json(
      { error: "Concurrent non trouvé" },
      { status: 404 },
    );
  }

  await prisma.competitor.delete({ where: { id } });

  return Response.json({ ok: true });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession(request);
  if (!session) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  const workspaceId = await getUserWorkspaceId(session.userId);
  if (!workspaceId) {
    return Response.json({ error: "Aucun workspace trouvé" }, { status: 404 });
  }

  const { id } = await params;
  const body = (await request.json()) as {
    notes?: string;
    name?: string;
    platform?: string;
    profileUrl?: string;
  };

  const competitor = await prisma.competitor.findFirst({
    where: { id, workspaceId },
  });

  if (!competitor) {
    return Response.json(
      { error: "Concurrent non trouvé" },
      { status: 404 },
    );
  }

  const updateData: Record<string, unknown> = {};
  if (body.notes !== undefined) updateData.notes = body.notes;
  if (body.name !== undefined) updateData.name = body.name;
  if (body.platform !== undefined) updateData.platform = body.platform;
  if (body.profileUrl !== undefined) updateData.profileUrl = body.profileUrl;

  const updated = await prisma.competitor.update({
    where: { id },
    data: updateData,
  });

  return Response.json({ competitor: updated });
}
