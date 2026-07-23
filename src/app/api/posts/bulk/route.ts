import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

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

  const { posts } = (await request.json()) as {
    posts: Array<{ platform: string; body: string; scheduledAt: string }>;
  };

  if (!Array.isArray(posts) || posts.length === 0) {
    return Response.json({ error: "Aucun post fourni" }, { status: 400 });
  }

  const validPlatforms = ["LINKEDIN", "TWITTER", "INSTAGRAM", "FACEBOOK", "TIKTOK", "PINTEREST", "WORDPRESS", "MEDIUM"] as const;

  let campaign = await prisma.campaign.findFirst({
    where: { workspaceId },
    select: { id: true },
  });

  if (!campaign) {
    campaign = await prisma.campaign.create({
      data: { workspaceId, title: "Calendrier" },
      select: { id: true },
    });
  }

  let createdCount = 0;

  for (const post of posts) {
    const platform = post.platform.toUpperCase();
    const resolvedPlatform = validPlatforms.includes(platform as typeof validPlatforms[number])
      ? (platform as typeof validPlatforms[number])
      : "LINKEDIN";

    const content = await prisma.content.create({
      data: {
        campaignId: campaign.id,
        sourceIdea: post.body.slice(0, 100),
        status: "SCHEDULED",
      },
    });

    await prisma.post.create({
      data: {
        contentId: content.id,
        platform: resolvedPlatform,
        body: post.body,
        scheduledAt: new Date(post.scheduledAt),
        status: "SCHEDULED",
      },
    });

    createdCount++;
  }

  return Response.json({ count: createdCount });
}
