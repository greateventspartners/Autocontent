import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

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

  const documents = await prisma.document.findMany({
    where: { workspaceId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      wordCount: true,
      tags: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return Response.json({ documents });
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

  const { title, content, tags } = await request.json() as {
    title?: string;
    content?: unknown;
    tags?: string;
  };

  const document = await prisma.document.create({
    data: {
      workspaceId,
      title: title || "Sans titre",
      content: content || undefined,
      tags: tags || null,
      wordCount: 0,
    },
  });

  return Response.json({ document });
}
