import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { suggestTime } from "@/lib/scheduling";

async function getUserWorkspaceId(userId: string) {
  const membership = await prisma.workspaceMember.findFirst({ where: { userId } });
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

  const { searchParams } = new URL(request.url);
  const platform = searchParams.get("platform");
  const date = searchParams.get("date") || undefined;
  const excludeId = searchParams.get("excludeId") || undefined;

  if (!platform) {
    return Response.json({ error: "platform requis" }, { status: 400 });
  }

  const now = new Date();
  const in7Days = new Date(now);
  in7Days.setDate(in7Days.getDate() + 7);

  const existingPosts = await prisma.post.findMany({
    where: {
      content: { campaign: { workspaceId } },
      platform: platform.toUpperCase() as "LINKEDIN" | "TWITTER" | "INSTAGRAM" | "FACEBOOK" | "TIKTOK" | "PINTEREST" | "WORDPRESS" | "MEDIUM",
      status: "SCHEDULED",
      scheduledAt: { not: null, gte: now },
    },
    select: { scheduledAt: true, platform: true, id: true },
  });

  const postsForScheduling = existingPosts.map((p) => ({
    scheduledAt: p.scheduledAt!,
    platform: p.platform,
  }));

  const result = suggestTime(platform, postsForScheduling, date, excludeId);

  return Response.json(result);
}
