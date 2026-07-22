import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

async function getUserWorkspaceId(userId: string) {
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId },
  });
  return membership?.workspaceId ?? null;
}

async function verifyAccess(workspaceId: string, campaignId: string) {
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) return { error: "Campagne introuvable", status: 404 };
  if (campaign.workspaceId !== workspaceId) return { error: "Non autorisé", status: 403 };
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

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      contents: {
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { posts: true } } },
      },
    },
  });

  return Response.json({ campaign });
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
    const { title, description, colorCode }: { title?: string; description?: string; colorCode?: string } = await request.json();

    const campaign = await prisma.campaign.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(colorCode !== undefined && { colorCode }),
      },
    });

    return Response.json({ campaign });
  } catch (error) {
    console.error("Update campaign error:", error);
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

  await prisma.campaign.delete({ where: { id } });
  return Response.json({ success: true });
}
