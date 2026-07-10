import { SignJWT } from "jose";
import { prisma } from "@/lib/prisma";

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET est requise");
  return new TextEncoder().encode(secret);
}

export async function POST(request: Request) {
  try {
    const { email } = (await request.json()) as { email?: string };

    if (!email) {
      return Response.json({ error: "Email requis" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return Response.json({
        message: "Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.",
      });
    }

    const resetToken = await new SignJWT({ userId: user.id, purpose: "reset-password" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(getJwtSecret());

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;

    console.log(`[RESET PASSWORD] Lien de réinitialisation pour ${email}:\n${resetUrl}\n`);

    return Response.json({
      message: "Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.",
      resetUrl,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return Response.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
