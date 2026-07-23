import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

async function getUserWorkspaceId(userId: string) {
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId },
  });
  return membership?.workspaceId ?? null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(request);
  if (!session) return Response.json({ error: "Non authentifié" }, { status: 401 });

  const { id: memberId } = await params;
  const workspaceId = await getUserWorkspaceId(session.userId);
  if (!workspaceId) return Response.json({ error: "Workspace introuvable" }, { status: 404 });

  // Check if the current user is OWNER or ADMIN
  const currentMember = await prisma.workspaceMember.findFirst({
    where: { userId: session.userId, workspaceId },
  });
  if (!currentMember || !["OWNER", "ADMIN"].includes(currentMember.role)) {
    return Response.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { role } = (await request.json()) as { role?: string };
  if (!role || !["ADMIN", "EDITOR", "VIEWER"].includes(role)) {
    return Response.json({ error: "Rôle invalide" }, { status: 400 });
  }

  // Cannot change the owner's role
  const targetMember = await prisma.workspaceMember.findUnique({
    where: { id: memberId },
  });
  if (!targetMember) return Response.json({ error: "Membre introuvable" }, { status: 404 });
  if (targetMember.role === "OWNER") {
    return Response.json({ error: "Impossible de modifier le rôle du propriétaire" }, { status: 403 });
  }

  const updated = await prisma.workspaceMember.update({
    where: { id: memberId },
    data: { role: role as any },
    include: { user: { select: { id: true, email: true, name: true } } },
  });

  return Response.json({ member: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(_request);
  if (!session) return Response.json({ error: "Non authentifié" }, { status: 401 });

  const { id: memberId } = await params;
  const workspaceId = await getUserWorkspaceId(session.userId);
  if (!workspaceId) return Response.json({ error: "Workspace introuvable" }, { status: 404 });

  // Check if the current user is OWNER or ADMIN
  const currentMember = await prisma.workspaceMember.findFirst({
    where: { userId: session.userId, workspaceId },
  });
  if (!currentMember || !["OWNER", "ADMIN"].includes(currentMember.role)) {
    return Response.json({ error: "Non autorisé" }, { status: 403 });
  }

  const targetMember = await prisma.workspaceMember.findUnique({
    where: { id: memberId },
  });
  if (!targetMember) return Response.json({ error: "Membre introuvable" }, { status: 404 });
  if (targetMember.role === "OWNER") {
    return Response.json({ error: "Impossible de retirer le propriétaire" }, { status: 403 });
  }

  await prisma.workspaceMember.delete({
    where: { id: memberId },
  });

  return Response.json({ success: true });
}
