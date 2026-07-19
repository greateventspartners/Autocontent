import { WorkspaceRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import crypto from "crypto";

async function getUserWorkspaceId(userId: string) {
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId },
  });
  return membership?.workspaceId ?? null;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  const workspaceId = await getUserWorkspaceId(session.userId);
  if (!workspaceId) {
    return Response.json({ error: "Aucun workspace trouvé" }, { status: 404 });
  }

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.userId, workspaceId },
  });

  if (!membership || membership.role !== "OWNER") {
    return Response.json({ error: "Seuls les propriétaires peuvent inviter" }, { status: 403 });
  }

  try {
    const { email, role }: { email?: string; role?: string } = await request.json();

    if (!email) {
      return Response.json({ error: "Email requis" }, { status: 400 });
    }

    const existingMember = await prisma.workspaceMember.findFirst({
      where: { workspaceId, user: { email } },
    });

    if (existingMember) {
      return Response.json({ error: "Cet utilisateur est déjà membre" }, { status: 409 });
    }

    const validRoles = ["EDITOR", "CLIENT"];
    const inviteRole = role && validRoles.includes(role) ? role : "EDITOR";

    const token = crypto.randomBytes(32).toString("hex");

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invite = await prisma.invitation.create({
      data: {
        workspaceId,
        email,
        token,
        role: inviteRole as WorkspaceRole,
        expiresAt,
      },
    });

    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/accept-invite?token=${token}`;

    return Response.json({
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        expiresAt: invite.expiresAt,
        link: inviteLink,
      },
    });
  } catch (error) {
    console.error("Invite error:", error);
    return Response.json({ error: "Erreur lors de l'invitation" }, { status: 500 });
  }
}
