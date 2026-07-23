import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { generateInsights } from "@/lib/analytics/insights";
import type { Prisma } from "@/generated/prisma/client";

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

  const insights = await prisma.contentInsight.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return Response.json({ insights });
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

  const newInsights = await generateInsights(workspaceId);

  if (newInsights.length > 0) {
    await prisma.contentInsight.deleteMany({
      where: { workspaceId },
    });

    await prisma.contentInsight.createMany({
      data: newInsights.map((insight) => ({
        workspaceId,
        type: insight.type,
        platform: insight.platform,
        title: insight.title,
        description: insight.description,
        data: insight.data as Prisma.InputJsonValue,
      })),
    });
  }

  return Response.json({
    generated: newInsights.length,
    insights: newInsights,
  });
}
