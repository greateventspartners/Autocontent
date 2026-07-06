import { prisma } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { name, email, password }: { name?: string; email?: string; password?: string } = await request.json();

    if (!email || !password) {
      return Response.json(
        { error: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return Response.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return Response.json(
        { error: "Un compte avec cet email existe déjà" },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: name || null,
          email,
          password: hashedPassword,
        },
      });

      const workspace = await tx.workspace.create({
        data: {
          name: name ? `Espace de ${name}` : "Mon Workspace",
        },
      });

      await tx.workspaceMember.create({
        data: {
          userId: newUser.id,
          workspaceId: workspace.id,
          role: "OWNER",
        },
      });

      await tx.campaign.create({
        data: {
          workspaceId: workspace.id,
          title: "Copilot",
          description: "Contenus générés par le Copilot IA",
          colorCode: "#6366f1",
        },
      });

      return newUser;
    });

    await createSession(user.id, user.email);

    return Response.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return Response.json(
      { error: "Erreur lors de l'inscription" },
      { status: 500 }
    );
  }
}
