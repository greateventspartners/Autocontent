import { Platform } from "@/generated/prisma/client";
import { generateContent, type ImageInput } from "@/lib/gemini";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { copilotGenerateSchema, validateBody } from "@/lib/validation";

async function getUserWorkspaceId(userId: string) {
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId },
  });
  return membership?.workspaceId ?? null;
}

async function getOrCreateDefaultCampaign(workspaceId: string) {
  let campaign = await prisma.campaign.findFirst({
    where: { workspaceId, title: "Copilot" },
  });

  if (!campaign) {
    campaign = await prisma.campaign.create({
      data: {
        workspaceId,
        title: "Copilot",
        description: "Contenus générés par le Copilot IA",
        colorCode: "#6366f1",
      },
    });
  }

  return campaign;
}

async function getBrandKit(workspaceId: string) {
  const kit = await prisma.brandKit.findFirst({
    where: { workspaceId },
  });

  if (!kit) return null;

  return {
    toneOfVoice: kit.toneOfVoice,
    doAndDonts: kit.doAndDonts,
    keywords: kit.fonts ? (kit.fonts as { keywords?: string }).keywords : undefined,
  };
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

  try {
    const body = await request.json();
    const validation = validateBody(copilotGenerateSchema, body);
    if (!validation.success) return validation.error;

    const { prompt, platform, image } = validation.data;
    const normalized = platform.toLowerCase();

    const brandKit = await getBrandKit(workspaceId);
    const result = await generateContent(prompt, normalized, brandKit ?? undefined, image, workspaceId);

    const campaign = await getOrCreateDefaultCampaign(workspaceId);

    const content = await prisma.content.create({
      data: {
        campaignId: campaign.id,
        sourceIdea: prompt,
        status: "DRAFT",
      },
    });

    const post = await prisma.post.create({
      data: {
        contentId: content.id,
        platform: normalized.toUpperCase() as Platform,
        body: result.content,
        status: "DRAFT",
      },
    });

    return Response.json({
      ...result,
      contentId: content.id,
      postId: post.id,
    });
  } catch (error) {
    console.error("Generate error:", error);
    const message = error instanceof Error ? error.message : "Erreur lors de la génération";
    return Response.json({ error: message }, { status: 500 });
  }
}
