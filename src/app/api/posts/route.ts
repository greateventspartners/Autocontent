import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

async function getUserWorkspaceId(userId: string) {
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId },
  });
  return membership?.workspaceId ?? null;
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  const workspaceId = await getUserWorkspaceId(session.userId);
  if (!workspaceId) {
    return Response.json({ error: "Aucun workspace trouvé" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const calendar = searchParams.get("calendar") === "true";
  const platform = searchParams.get("platform");
  const campaignId = searchParams.get("campaignId");

  const where: Record<string, unknown> = {
    content: { campaign: { workspaceId } },
  };

  if (status) {
    where.status = status;
  }

  if (calendar) {
    where.scheduledAt = { not: null };
  }

  if (platform) {
    where.platform = platform.toUpperCase();
  }

  if (campaignId) {
    where.content = { ...(where.content as Record<string, unknown>), campaignId };
  }

  const posts = await prisma.post.findMany({
    where,
    include: {
      content: { select: { sourceIdea: true, campaign: { select: { id: true, title: true } } } },
    },
    orderBy: calendar ? { scheduledAt: "asc" } : { updatedAt: "desc" },
  });

  return Response.json({ posts });
}
