import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import crypto from "crypto";

async function getUserWorkspaceId(userId: string) {
  const membership = await prisma.workspaceMember.findFirst({ where: { userId } });
  return membership?.workspaceId ?? null;
}

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Non authentifié" }, { status: 401 });

  const workspaceId = await getUserWorkspaceId(session.userId);
  if (!workspaceId) return Response.json({ error: "Workspace introuvable" }, { status: 404 });

  const tokens = await prisma.clientToken.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ tokens });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Non authentifié" }, { status: 401 });

  const workspaceId = await getUserWorkspaceId(session.userId);
  if (!workspaceId) return Response.json({ error: "Workspace introuvable" }, { status: 404 });

  const { clientName, clientEmail, expiresInDays } = (await request.json()) as {
    clientName?: string;
    clientEmail?: string;
    expiresInDays?: number;
  };

  if (!clientName?.trim()) {
    return Response.json({ error: "Nom du client requis" }, { status: 400 });
  }

  const token = crypto.randomUUID();
  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : null;

  const clientToken = await prisma.clientToken.create({
    data: {
      workspaceId,
      token,
      clientName: clientName.trim(),
      clientEmail: clientEmail?.trim() || null,
      expiresAt,
    },
  });

  return Response.json({
    token: clientToken.token,
    link: `/client/${clientToken.token}`,
  }, { status: 201 });
}
