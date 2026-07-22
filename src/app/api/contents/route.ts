import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

async function getUserWorkspaceId(userId: string) {
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId },
  });
  return membership?.workspaceId ?? null;
}

export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  const workspaceId = await getUserWorkspaceId(session.userId);
  if (!workspaceId) return Response.json({ error: "Aucun workspace" }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get("campaignId");

  const where: Record<string, unknown> = { campaign: { workspaceId } };
  if (campaignId) where.campaignId = campaignId;

  const contents = await prisma.content.findMany({
    where,
    include: {
      campaign: { select: { title: true, colorCode: true } },
      _count: { select: { posts: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ contents });
}

export async function POST(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  const workspaceId = await getUserWorkspaceId(session.userId);
  if (!workspaceId) return Response.json({ error: "Aucun workspace" }, { status: 404 });

  try {
    const { campaignId, sourceIdea }: { campaignId?: string; sourceIdea?: string } = await request.json();

    if (!campaignId || !sourceIdea) {
      return Response.json(
        { error: "campaignId et sourceIdea sont requis" },
        { status: 400 },
      );
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });
    if (!campaign) {
      return Response.json({ error: "Campagne introuvable" }, { status: 404 });
    }
    if (campaign.workspaceId !== workspaceId) {
      return Response.json({ error: "Non autorisé" }, { status: 403 });
    }

    const content = await prisma.content.create({
      data: {
        campaignId,
        sourceIdea,
      },
    });

    return Response.json({ content }, { status: 201 });
  } catch (error) {
    console.error("Create content error:", error);
    return Response.json({ error: "Erreur lors de la création" }, { status: 500 });
  }
}
