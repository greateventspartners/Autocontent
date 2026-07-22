import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession(_request);
  if (!session) return Response.json({ error: "Non authentifié" }, { status: 401 });

  const { id: postId } = await params;

  const comments = await prisma.comment.findMany({
    where: { postId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });

  return Response.json({ comments });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession(request);
  if (!session) return Response.json({ error: "Non authentifié" }, { status: 401 });

  const { id: postId } = await params;
  const { text } = (await request.json()) as { text?: string };

  if (!text?.trim()) {
    return Response.json({ error: "Le commentaire ne peut pas être vide" }, { status: 400 });
  }

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) return Response.json({ error: "Post introuvable" }, { status: 404 });

  const comment = await prisma.comment.create({
    data: {
      postId,
      userId: session.userId,
      text: text.trim(),
    },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return Response.json({ comment }, { status: 201 });
}
