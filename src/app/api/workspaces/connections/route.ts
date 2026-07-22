import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.userId },
  });

  if (!membership) {
    return Response.json({ error: "Aucun workspace" }, { status: 404 });
  }

  const connections = await prisma.platformConnection.findMany({
    where: { workspaceId: membership.workspaceId },
    select: {
      platform: true,
      platformUserId: true,
      platformUserName: true,
      tokenExpiresAt: true,
      createdAt: true,
    },
  });

  return Response.json({ connections });
}
