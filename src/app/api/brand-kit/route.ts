import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

async function getUserWorkspaceId(userId: string) {
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId },
    include: { workspace: true },
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

  const brandKits = await prisma.brandKit.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ brandKits });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  const workspaceId = await getUserWorkspaceId(session.userId);
  if (!workspaceId) {
    return Response.json({ error: "Aucun workspace trouvé" }, { status: 404 });
  }

  try {
    const body = await request.json() as Record<string, unknown>;

    if (!body.name) {
      return Response.json({ error: "Le nom est requis" }, { status: 400 });
    }

    const brandKit = await prisma.brandKit.create({
      data: {
        workspaceId,
        name: String(body.name),
        logoUrl: body.logoUrl ? String(body.logoUrl) : null,
        colors: body.colors ? (body.colors as Prisma.InputJsonValue) : Prisma.JsonNull,
        fonts: body.fonts ? (body.fonts as Prisma.InputJsonValue) : Prisma.JsonNull,
        toneOfVoice: body.toneOfVoice ? String(body.toneOfVoice) : null,
        doAndDonts: body.doAndDonts ? String(body.doAndDonts) : null,
      },
    });

    return Response.json({ brandKit }, { status: 201 });
  } catch (error) {
    console.error("Create brandKit error:", error);
    return Response.json({ error: "Erreur lors de la création" }, { status: 500 });
  }
}
