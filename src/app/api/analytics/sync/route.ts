import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { fetchMetrics } from "@/lib/analytics";
import { SUPPORTED_ANALYTICS_PLATFORMS } from "@/lib/analytics";

async function getUserWorkspaceId(userId: string) {
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId },
  });
  return membership?.workspaceId ?? null;
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

  const connections = await prisma.platformConnection.findMany({
    where: {
      workspaceId,
      platform: { in: SUPPORTED_ANALYTICS_PLATFORMS },
    },
  });

  const connectionMap = new Map(connections.map((c) => [c.platform, c.accessToken]));

  const publishedPosts = await prisma.post.findMany({
    where: {
      status: "PUBLISHED",
      platformPostId: { not: null },
      platform: { in: SUPPORTED_ANALYTICS_PLATFORMS as any[] },
      content: { campaign: { workspaceId } },
    },
    select: {
      id: true,
      platform: true,
      platformPostId: true,
    },
  });

  let synced = 0;

  for (const post of publishedPosts) {
    const accessToken = connectionMap.get(post.platform);
    if (!accessToken || !post.platformPostId) continue;

    const existingToday = await prisma.postAnalytics.findFirst({
      where: {
        postId: post.id,
        fetchedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });

    if (existingToday) continue;

    const metrics = await fetchMetrics(
      post.platform,
      accessToken,
      post.platformPostId
    );

    if (!metrics) continue;

    await prisma.postAnalytics.create({
      data: {
        postId: post.id,
        impressions: metrics.impressions,
        reach: metrics.reach,
        likes: metrics.likes,
        comments: metrics.comments,
        shares: metrics.shares,
        clicks: metrics.clicks,
      },
    });

    synced++;
  }

  return Response.json({ synced, total: publishedPosts.length });
}
