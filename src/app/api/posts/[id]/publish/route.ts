import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { publishPost } from "@/lib/publishers";

async function getUserWorkspaceId(userId: string) {
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId },
  });
  return membership?.workspaceId ?? null;
}

async function verifyAccess(workspaceId: string, postId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { content: { include: { campaign: { select: { workspaceId: true } } } } },
  });
  if (!post) return { error: "Post introuvable", status: 404 as const };
  if (post.content.campaign.workspaceId !== workspaceId)
    return { error: "Non autorisé", status: 403 as const };
  return null;
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;
  const workspaceId = await getUserWorkspaceId(session.userId);
  if (!workspaceId) {
    return Response.json({ error: "Aucun workspace trouvé" }, { status: 404 });
  }

  const denied = await verifyAccess(workspaceId, id);
  if (denied) return Response.json({ error: denied.error }, { status: denied.status });

  const post = await prisma.post.findUnique({
    where: { id },
    include: { content: { include: { campaign: { select: { workspaceId: true } } } } },
  });

  if (!post) {
    return Response.json({ error: "Post introuvable" }, { status: 404 });
  }

  const connection = await prisma.platformConnection.findUnique({
    where: {
      workspaceId_platform: {
        workspaceId: post.content.campaign.workspaceId,
        platform: post.platform,
      },
    },
  });

  const result = await publishPost({
    platform: post.platform.toLowerCase(),
    body: post.body,
    connection: connection
      ? {
          accessToken: connection.accessToken,
          platformUserId: connection.platformUserId,
        }
      : null,
  });

  if (result.ok) {
    await prisma.post.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        platformPostId: result.platformPostId ?? null,
        publishedAt: new Date(),
      },
    });
    return Response.json({ result });
  }

  return Response.json(
    { result, composerUrl: result.composerUrl ?? null, text: post.body },
    { status: 200 },
  );
}
