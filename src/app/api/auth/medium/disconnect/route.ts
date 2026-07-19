import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  const member = await prisma.workspaceMember.findFirst({
    where: { userId: session.userId },
  });
  const workspaceId = member?.workspaceId;

  if (!workspaceId) {
    return Response.json({ error: "Aucun workspace" }, { status: 404 });
  }

  await prisma.platformConnection.deleteMany({
    where: { workspaceId, platform: "medium" },
  });

  return Response.json({ success: true });
}
