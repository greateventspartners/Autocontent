import { Status } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

async function getUserWorkspaceId(userId: string) {
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId },
  });
  return membership?.workspaceId ?? null;
}

async function verifyAccess(workspaceId: string, contentId: string) {
  const content = await prisma.content.findUnique({
    where: { id: contentId },
    include: { campaign: { select: { workspaceId: true } } },
  });
  if (!content) return { error: "Contenu introuvable", status: 404 };
  if (content.campaign.workspaceId !== workspaceId) return { error: "Non autorisé", status: 403 };
  return null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession(_request);
  if (!session) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;
  const workspaceId = await getUserWorkspaceId(session.userId);
  if (!workspaceId) return Response.json({ error: "Aucun workspace" }, { status: 404 });

  const denied = await verifyAccess(workspaceId, id);
  if (denied) return Response.json({ error: denied.error }, { status: denied.status });

  const content = await prisma.content.findUnique({
    where: { id },
    include: {
      campaign: { select: { title: true, colorCode: true } },
      posts: { orderBy: { createdAt: "asc" } },
    },
  });

  return Response.json({ content });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession(request);
  if (!session) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;
  const workspaceId = await getUserWorkspaceId(session.userId);
  if (!workspaceId) return Response.json({ error: "Aucun workspace" }, { status: 404 });

  const denied = await verifyAccess(workspaceId, id);
  if (denied) return Response.json({ error: denied.error }, { status: denied.status });

  try {
    const body = await request.json() as { sourceIdea?: string; status?: string };

    const content = await prisma.content.update({
      where: { id },
      data: {
        ...(body.sourceIdea !== undefined && { sourceIdea: body.sourceIdea }),
        ...(body.status !== undefined && { status: body.status as Status }),
      },
    });

    return Response.json({ content });
  } catch (error) {
    console.error("Update content error:", error);
    return Response.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession(_request);
  if (!session) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;
  const workspaceId = await getUserWorkspaceId(session.userId);
  if (!workspaceId) return Response.json({ error: "Aucun workspace" }, { status: 404 });

  const denied = await verifyAccess(workspaceId, id);
  if (denied) return Response.json({ error: denied.error }, { status: denied.status });

  await prisma.content.delete({ where: { id } });
  return Response.json({ success: true });
}
