import { SignJWT } from "jose";
import { prisma } from "@/lib/prisma";
import { sendEmail, buildResetPasswordEmail } from "@/lib/email";

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

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://autocontent.greateventspartners.workers.dev";
    const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

    if (process.env.RESEND_API_KEY) {
      try {
        await sendEmail({
          to: email,
          subject: "Réinitialisation de votre mot de passe Autocontent",
          html: buildResetPasswordEmail(resetUrl),
        });
      } catch (emailError) {
        console.error("Failed to send reset email:", emailError);
      }
    } else {
      console.log(`[RESET PASSWORD] Lien de réinitialisation pour ${email}:\n${resetUrl}\n`);
    }

    return Response.json({
      message: "Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return Response.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
