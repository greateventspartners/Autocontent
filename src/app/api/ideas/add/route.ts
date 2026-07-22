import { Platform } from "@/generated/prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getUserWorkspaceId(userId: string) {
  const membership = await prisma.workspaceMember.findFirst({ where: { userId } });
  return membership?.workspaceId ?? null;
}

async function getOrCreateDefaultCampaign(workspaceId: string) {
  let campaign = await prisma.campaign.findFirst({ where: { workspaceId, title: "Copilot" } });
  if (!campaign) {
    campaign = await prisma.campaign.create({
      data: { workspaceId, title: "Copilot", description: "Contenus générés par le Copilot IA", colorCode: "#6366f1" },
    });
  }
  return campaign;
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

  const { title, platform, hook }: { title?: string; platform?: string; hook?: string } = await request.json();
  if (!title || !platform) {
    return Response.json({ error: "title et platform requis" }, { status: 400 });
  }

  const campaign = await getOrCreateDefaultCampaign(workspaceId);

  const content = await prisma.content.create({
    data: { campaignId: campaign.id, sourceIdea: title, status: "DRAFT" },
  });

  const scheduledAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const post = await prisma.post.create({
    data: {
      contentId: content.id,
      platform: platform.toUpperCase() as Platform,
      body: hook || title,
      status: "SCHEDULED",
      scheduledAt,
    },
  });

  return Response.json({ post });
}
