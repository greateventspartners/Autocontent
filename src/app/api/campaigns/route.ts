import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

async function getUserWorkspaceId(userId: string) {
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId },
  });
  return membership?.workspaceId ?? null;
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  const workspaceId = await getUserWorkspaceId(session.userId);
  if (!workspaceId) {
    return Response.json({ error: "Aucun workspace trouvé" }, { status: 404 });
  }

  const campaigns = await prisma.campaign.findMany({
    where: { workspaceId },
    include: { _count: { select: { contents: true } } },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ campaigns });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  const workspaceId = await getUserWorkspaceId(session.userId);
  if (!workspaceId) {
    return Response.json({ error: "Aucun workspace trouvé" }, { status: 404 });
  }

  try {
    const { title, description, colorCode }: { title?: string; description?: string; colorCode?: string } = await request.json();

    if (!title) {
      return Response.json({ error: "Le titre est requis" }, { status: 400 });
    }

    const campaign = await prisma.campaign.create({
      data: {
        workspaceId,
        title,
        description: description || null,
        colorCode: colorCode || null,
      },
    });

    return Response.json({ campaign }, { status: 201 });
  } catch (error) {
    console.error("Create campaign error:", error);
    return Response.json({ error: "Erreur lors de la création" }, { status: 500 });
  }
}
