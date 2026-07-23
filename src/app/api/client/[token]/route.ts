import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const clientToken = await prisma.clientToken.findUnique({
    where: { token },
    include: { workspace: { select: { id: true, name: true } } },
  });

  if (!clientToken) {
    return Response.json({ error: "Lien invalide" }, { status: 404 });
  }

  if (clientToken.expiresAt && clientToken.expiresAt < new Date()) {
    return Response.json({ error: "Lien expiré" }, { status: 410 });
  }

  const posts = await prisma.post.findMany({
    where: {
      status: { in: ["PENDING_APPROVAL", "APPROVED", "REJECTED"] },
      content: { campaign: { workspaceId: clientToken.workspaceId } },
    },
    include: {
      content: { select: { sourceIdea: true } },
      comments: {
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return Response.json({
    workspaceName: clientToken.workspace.name,
    clientName: clientToken.clientName,
    posts: posts.map((p) => ({
      id: p.id,
      platform: p.platform.toLowerCase(),
      body: p.body,
      status: p.status,
      sourceIdea: p.content.sourceIdea,
      scheduledAt: p.scheduledAt?.toISOString() ?? null,
      comments: p.comments.map((c) => ({
        text: c.text,
        author: c.user.name || c.user.email.split("@")[0],
        createdAt: c.createdAt.toISOString(),
      })),
    })),
  });
}
