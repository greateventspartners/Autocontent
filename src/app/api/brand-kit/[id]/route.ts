import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

async function getUserWorkspaceId(userId: string) {
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId },
  });
  return membership?.workspaceId ?? null;
}

async function verifyAccess(workspaceId: string, brandKitId: string) {
  const brandKit = await prisma.brandKit.findUnique({ where: { id: brandKitId } });
  if (!brandKit) return { error: "Brand Kit introuvable", status: 404 };
  if (brandKit.workspaceId !== workspaceId) return { error: "Non autorisé", status: 403 };
  return null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;
  const workspaceId = await getUserWorkspaceId(session.userId);
  if (!workspaceId) return Response.json({ error: "Aucun workspace" }, { status: 404 });

  const denied = await verifyAccess(workspaceId, id);
  if (denied) return Response.json({ error: denied.error }, { status: denied.status });

  const brandKit = await prisma.brandKit.findUnique({ where: { id } });
  return Response.json({ brandKit });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;
  const workspaceId = await getUserWorkspaceId(session.userId);
  if (!workspaceId) return Response.json({ error: "Aucun workspace" }, { status: 404 });

  const denied = await verifyAccess(workspaceId, id);
  if (denied) return Response.json({ error: denied.error }, { status: denied.status });

  try {
    const body: Record<string, unknown> = await request.json();

    const brandKit = await prisma.brandKit.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: String(body.name) }),
        ...(body.logoUrl !== undefined && { logoUrl: String(body.logoUrl) }),
        ...(body.colors !== undefined && { colors: body.colors as Prisma.InputJsonValue }),
        ...(body.fonts !== undefined && { fonts: body.fonts as Prisma.InputJsonValue }),
        ...(body.toneOfVoice !== undefined && { toneOfVoice: String(body.toneOfVoice) }),
        ...(body.doAndDonts !== undefined && { doAndDonts: String(body.doAndDonts) }),
        ...(body.voiceSamples !== undefined && { voiceSamples: body.voiceSamples as Prisma.InputJsonValue }),
      },
    });

    return Response.json({ brandKit });
  } catch (error) {
    console.error("Update brandKit error:", error);
    return Response.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;
  const workspaceId = await getUserWorkspaceId(session.userId);
  if (!workspaceId) return Response.json({ error: "Aucun workspace" }, { status: 404 });

  const denied = await verifyAccess(workspaceId, id);
  if (denied) return Response.json({ error: denied.error }, { status: denied.status });

  await prisma.brandKit.delete({ where: { id } });
  return Response.json({ success: true });
}
