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

  const url = new URL(request.url);
  const range = url.searchParams.get("range") || "7";

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const daysAgo = range === "30" ? 30 : 7;
  const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

  const [
    publishedThisMonth,
    pendingApproval,
    totalContents,
    recentPosts,
    totalPosts,
    postsByPlatform,
    postsByStatus,
    dailyPublished,
  ] = await Promise.all([
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
    prisma.post.groupBy({
      by: ["platform"],
      _count: { id: true },
      where: {
        content: { campaign: { workspaceId } },
        status: "PUBLISHED",
        publishedAt: { gte: startDate },
      },
    }),
    prisma.post.groupBy({
      by: ["status"],
      _count: { id: true },
      where: {
        content: { campaign: { workspaceId } },
      },
    }),
    prisma.$queryRawUnsafe<{ day: string; count: bigint }[]>(
      `SELECT DATE(p."publishedAt") as day, COUNT(*) as count
       FROM "Post" p
       JOIN "Content" c ON p."contentId" = c.id
       JOIN "Campaign" ca ON c."campaignId" = ca.id
       WHERE ca."workspaceId" = $1
         AND p."status" = 'PUBLISHED'
         AND p."publishedAt" >= $2
       GROUP BY DATE(p."publishedAt")
       ORDER BY day ASC`,
      workspaceId,
      startDate,
    ),
  ]);

  const recentActivity = recentPosts.map((post) => ({
    id: post.id,
    title: post.content.sourceIdea,
    platform: post.platform.toLowerCase(),
    status: post.status,
    time: post.updatedAt.toISOString(),
  }));

  const platformData = postsByPlatform.map((item) => ({
    platform: item.platform.toLowerCase(),
    count: Number(item._count.id),
  }));

  const statusData = postsByStatus.map((item) => ({
    status: item.status,
    count: Number(item._count.id),
  }));

  const dailyData = dailyPublished.map((item) => ({
    day: item.day,
    count: Number(item.count),
  }));

  return Response.json({
    stats: {
      publishedThisMonth,
      pendingApproval,
      totalContents,
      totalPosts,
    },
    recentActivity,
    charts: {
      platformData,
      statusData,
      dailyData,
    },
  });
}
