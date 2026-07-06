import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const { token }: { token?: string } = await request.json();

    if (!token) {
      return Response.json({ error: "Token requis" }, { status: 400 });
    }

    const invite = await prisma.invitation.findUnique({
      where: { token },
    });

    if (!invite) {
      return Response.json({ error: "Invitation invalide" }, { status: 404 });
    }

    if (invite.expiresAt < new Date()) {
      return Response.json({ error: "Invitation expirée" }, { status: 410 });
    }

    if (invite.email !== session.email) {
      return Response.json({ error: "Cette invitation n'est pas pour vous" }, { status: 403 });
    }

    const existingMember = await prisma.workspaceMember.findFirst({
      where: { workspaceId: invite.workspaceId, userId: session.userId },
    });

    if (existingMember) {
      return Response.json({ error: "Vous êtes déjà membre" }, { status: 409 });
    }

    const member = await prisma.$transaction(async (tx) => {
      const newMember = await tx.workspaceMember.create({
        data: {
          userId: session.userId,
          workspaceId: invite.workspaceId,
          role: invite.role,
        },
      });

      await tx.invitation.delete({
        where: { id: invite.id },
      });

      return newMember;
    });

    return Response.json({
      success: true,
      member: {
        id: member.id,
        role: member.role,
        workspaceId: member.workspaceId,
      },
    });
  } catch (error) {
    console.error("Accept invite error:", error);
    return Response.json({ error: "Erreur lors de l'acceptation" }, { status: 500 });
  }
}
