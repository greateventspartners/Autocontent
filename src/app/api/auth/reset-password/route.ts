import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET est requise");
  return new TextEncoder().encode(secret);
}

export async function POST(request: Request) {
  try {
    const { token, password } = (await request.json()) as { token?: string; password?: string };

    if (!token || !password) {
      return Response.json({ error: "Token et mot de passe requis" }, { status: 400 });
    }

    if (password.length < 8) {
      return Response.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères" },
        { status: 400 }
      );
    }

    let payload;
    try {
      const result = await jwtVerify(token, getJwtSecret());
      payload = result.payload;
    } catch {
      return Response.json({ error: "Lien invalide ou expiré" }, { status: 400 });
    }

    if (payload.purpose !== "reset-password") {
      return Response.json({ error: "Token invalide" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId as string } });
    if (!user) {
      return Response.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    const hashedPassword = await hashPassword(password);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return Response.json({ message: "Mot de passe réinitialisé avec succès" });
  } catch (error) {
    console.error("Reset password error:", error);
    return Response.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
