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
    dailyPublishedPosts,
    analyticsAgg,
    platformReach,
    topPosts,
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
    prisma.post.findMany({
      where: {
        content: { campaign: { workspaceId } },
        status: "PUBLISHED",
        publishedAt: { gte: startDate },
      },
      select: { publishedAt: true },
      orderBy: { publishedAt: "asc" },
    }),
    prisma.postAnalytics.aggregate({
      _sum: {
        impressions: true,
        reach: true,
        likes: true,
        comments: true,
        shares: true,
        clicks: true,
      },
      where: {
        post: { content: { campaign: { workspaceId } } },
      },
    }),
    prisma.postAnalytics.groupBy({
      by: ["postId"],
      _sum: { reach: true },
      _max: { fetchedAt: true },
      where: {
        post: {
          content: { campaign: { workspaceId } },
          publishedAt: { gte: startDate },
        },
      },
      orderBy: { _sum: { reach: "desc" } },
      take: 5,
    }),
    prisma.postAnalytics.groupBy({
      by: ["postId"],
      _sum: { reach: true, impressions: true, likes: true, comments: true, shares: true },
      _max: { fetchedAt: true },
      where: {
        post: {
          content: { campaign: { workspaceId } },
          status: "PUBLISHED",
        },
      },
      orderBy: { _sum: { reach: "desc" } },
      take: 3,
    }),
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

  const dailyMap = new Map<string, number>();
  for (const post of dailyPublishedPosts) {
    if (!post.publishedAt) continue;
    const day = post.publishedAt.toISOString().slice(0, 10);
    dailyMap.set(day, (dailyMap.get(day) || 0) + 1);
  }
  const dailyData = Array.from(dailyMap.entries())
    .map(([day, count]) => ({ day, count }))
    .sort((a, b) => a.day.localeCompare(b.day));

  const totalReach = Number(analyticsAgg._sum.reach ?? 0);
  const totalImpressions = Number(analyticsAgg._sum.impressions ?? 0);
  const totalLikes = Number(analyticsAgg._sum.likes ?? 0);
  const totalComments = Number(analyticsAgg._sum.comments ?? 0);
  const totalShares = Number(analyticsAgg._sum.shares ?? 0);
  const totalClicks = Number(analyticsAgg._sum.clicks ?? 0);

  const engagement =
    totalReach > 0
      ? ((totalLikes + totalComments + totalShares) / totalReach) * 100
      : 0;

  const reachByPlatform = platformReach.map((item) => ({
    postId: item.postId,
    reach: Number(item._sum.reach ?? 0),
  }));

  const topPostsData = await Promise.all(
    topPosts.map(async (row) => {
      const post = await prisma.post.findUnique({
        where: { id: row.postId },
        select: {
          id: true,
          platform: true,
          body: true,
          publishedAt: true,
          content: { select: { sourceIdea: true } },
        },
      });
      if (!post) return null;
      return {
        id: post.id,
        title: post.content.sourceIdea,
        body: post.body.slice(0, 80),
        platform: post.platform.toLowerCase(),
        publishedAt: post.publishedAt?.toISOString() ?? null,
        reach: Number(row._sum.reach ?? 0),
        impressions: Number(row._sum.impressions ?? 0),
        likes: Number(row._sum.likes ?? 0),
        comments: Number(row._sum.comments ?? 0),
        shares: Number(row._sum.shares ?? 0),
      };
    })
  );

  return Response.json({
    stats: {
      publishedThisMonth,
      pendingApproval,
      totalContents,
      totalPosts,
      totalReach,
      totalImpressions,
      engagement: Math.round(engagement * 10) / 10,
      totalLikes,
      totalComments,
      totalShares,
      totalClicks,
    },
    recentActivity,
    charts: {
      platformData,
      statusData,
      dailyData,
      reachByPlatform,
    },
    topPosts: topPostsData.filter(Boolean),
  });
}
