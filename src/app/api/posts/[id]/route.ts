import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

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
  if (!post) return { error: "Post introuvable", status: 404 };
  if (post.content.campaign.workspaceId !== workspaceId) return { error: "Non autorisé", status: 403 };
  return null;
}

export async function PATCH(
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
    const { status, body, scheduledAt, firstComment }: Record<string, unknown> = await request.json();

    const data: Record<string, unknown> = {};
    if (status !== undefined) {
      const validStatuses = ["DRAFT", "PENDING_APPROVAL", "APPROVED", "SCHEDULED", "PUBLISHED", "FAILED"];
      if (!validStatuses.includes(String(status))) {
        return Response.json({ error: "Statut invalide" }, { status: 400 });
      }
      data.status = status;
      if (status === "PUBLISHED") data.publishedAt = new Date();
    }
    if (body !== undefined) data.body = body;
    if (scheduledAt !== undefined) data.scheduledAt = scheduledAt ? new Date(String(scheduledAt)) : null;
    if (firstComment !== undefined) data.firstComment = firstComment;

    const post = await prisma.post.update({
      where: { id },
      data,
      include: {
        content: { select: { sourceIdea: true } },
      },
    });

    return Response.json({ post });
  } catch (error) {
    console.error("Update post error:", error);
    return Response.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
  }
}
