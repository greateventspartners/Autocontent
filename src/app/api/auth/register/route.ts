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

    const newUser = await prisma.user.create({
      data: {
        name: name || null,
        email,
        password: hashedPassword,
      },
    });

    const workspace = await prisma.workspace.create({
      data: {
        name: name ? `Espace de ${name}` : "Mon Workspace",
      },
    });

    await prisma.workspaceMember.create({
      data: {
        userId: newUser.id,
        workspaceId: workspace.id,
        role: "OWNER",
      },
    });

    await prisma.campaign.create({
      data: {
        workspaceId: workspace.id,
        title: "Copilot",
        description: "Contenus générés par le Copilot IA",
        colorCode: "#6366f1",
      },
    });

    const { cookie } = await createSession(newUser.id, newUser.email);

    const res = Response.json({
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
      redirect: "/onboarding",
    });
    res.headers.append("Set-Cookie", cookie);
    return res;
  } catch (error: any) {
    console.error("Register error:", error?.message, error?.name, error?.stack?.substring(0, 500));
    return Response.json(
      { error: "Erreur lors de l'inscription", detail: error?.message },
      { status: 500 }
    );
  }
}
