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

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [publishedThisMonth, pendingApproval, totalContents, recentPosts, totalPosts] = await Promise.all([
    prisma.post.count({
      where: {
        status: "PUBLISHED",
        publishedAt: { gte: firstOfMonth },
        content: { campaign: { workspaceId } },
      },
    }),
    prisma.post.count({
      where: {
        status: "PENDING_APPROVAL",
        content: { campaign: { workspaceId } },
      },
    }),
    prisma.content.count({
      where: { campaign: { workspaceId } },
    }),
    prisma.post.findMany({
      where: { content: { campaign: { workspaceId } } },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        content: { select: { sourceIdea: true } },
      },
    }),
    prisma.post.count({
      where: { content: { campaign: { workspaceId } } },
    }),
  ]);

  const recentActivity = recentPosts.map((post) => ({
    id: post.id,
    title: post.content.sourceIdea,
    platform: post.platform.toLowerCase(),
    status: post.status,
    time: post.updatedAt.toISOString(),
  }));

  return Response.json({
    stats: {
      publishedThisMonth,
      pendingApproval,
      totalContents,
      totalPosts,
    },
    recentActivity,
  });
}
