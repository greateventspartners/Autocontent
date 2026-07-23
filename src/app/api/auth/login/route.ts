import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession } from "@/lib/auth";
import { loginSchema, validateBody } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = validateBody(loginSchema, body);
    if (!validation.success) return validation.error;

    const { email, password } = validation.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      return Response.json(
        { error: "Email ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return Response.json(
        { error: "Email ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    const { cookie } = await createSession(user.id, user.email);

    const res = Response.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
    res.headers.append("Set-Cookie", cookie);
    return res;
  } catch (error) {
    console.error("Login error:", error);
    return Response.json(
      { error: "Erreur lors de la connexion" },
      { status: 500 }
    );
  }
}
