import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const clientToken = await prisma.clientToken.findUnique({
    where: { token },
    include: { workspace: { select: { id: true } } },
  });

  if (!clientToken) {
    return Response.json({ error: "Lien invalide" }, { status: 404 });
  }

  if (clientToken.expiresAt && clientToken.expiresAt < new Date()) {
    return Response.json({ error: "Lien expiré" }, { status: 410 });
  }

  const { postId, action, comment } = (await request.json()) as {
    postId?: string;
    action?: string;
    comment?: string;
  };

  if (!postId || !action) {
    return Response.json({ error: "postId et action requis" }, { status: 400 });
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { content: { select: { campaign: { select: { workspaceId: true } } } } },
  });

  if (!post || post.content.campaign.workspaceId !== clientToken.workspaceId) {
    return Response.json({ error: "Post introuvable" }, { status: 404 });
  }

  const newStatus = action === "approve" ? "APPROVED" : "REJECTED";

  await prisma.post.update({
    where: { id: postId },
    data: { status: newStatus as any },
  });

  if (comment?.trim()) {
    const owner = await prisma.workspaceMember.findFirst({
      where: { workspaceId: clientToken.workspaceId, role: "OWNER" },
    });
    if (owner) {
      await prisma.comment.create({
        data: {
          postId,
          userId: owner.userId,
          text: `[${clientToken.clientName}] ${comment.trim()}`,
        },
      });
    }
  }

  return Response.json({ success: true, status: newStatus });
}
