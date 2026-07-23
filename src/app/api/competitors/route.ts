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
  if (!workspaceId) {
    return Response.json({ error: "Aucun workspace trouvé" }, { status: 404 });
  }

  const competitors = await prisma.competitor.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ competitors });
}

export async function POST(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  const workspaceId = await getUserWorkspaceId(session.userId);
  if (!workspaceId) {
    return Response.json({ error: "Aucun workspace trouvé" }, { status: 404 });
  }

  const { name, platform, profileUrl } = (await request.json()) as {
    name?: string;
    platform?: string;
    profileUrl?: string;
  };

  if (!name || !platform) {
    return Response.json(
      { error: "Le nom et la plateforme sont requis" },
      { status: 400 },
    );
  }

  const competitor = await prisma.competitor.create({
    data: {
      workspaceId,
      name,
      platform,
      profileUrl: profileUrl || null,
    },
  });

  return Response.json({ competitor }, { status: 201 });
}
