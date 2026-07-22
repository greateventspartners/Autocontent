import { createSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/?error=google_denied", request.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/?error=google_invalid", request.url));
  }

  const cookieState = request.headers
    .get("cookie")
    ?.split(";")
    .find((c) => c.trim().startsWith("google_oauth_state="))
    ?.split("=")[1];

  if (cookieState !== state) {
    return NextResponse.redirect(
      new URL("/?error=google_state_mismatch", request.url)
    );
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri!,
        client_id: clientId!,
        client_secret: clientSecret!,
      }).toString(),
    });

    if (!tokenRes.ok) {
      throw new Error("Google token exchange failed");
    }

    const tokenData = (await tokenRes.json()) as {
      access_token: string;
      id_token: string;
    };

    const userInfoRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      }
    );

    if (!userInfoRes.ok) {
      throw new Error("Failed to fetch Google user info");
    }

    const googleUser = (await userInfoRes.json()) as {
      id: string;
      email: string;
      name: string;
      picture?: string;
    };

    let user = await prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    let isNewUser = false;

    if (user) {
      if (user.authProvider !== "GOOGLE") {
        return NextResponse.redirect(
          new URL("/?error=account_exists_with_email", request.url)
        );
      }
    } else {
      isNewUser = true;
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name,
          authProvider: "GOOGLE",
        },
      });

      const workspace = await prisma.workspace.create({
        data: {
          name: `Espace de ${googleUser.name}`,
        },
      });

      await prisma.workspaceMember.create({
        data: {
          userId: user.id,
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
    }

    await createSession(user.id, user.email);

    const destination = isNewUser ? "/onboarding" : "/dashboard";
    const res = NextResponse.redirect(new URL(destination, request.url));
    res.cookies.delete("google_oauth_state");
    if (!isNewUser) {
      res.cookies.set("onboarding_done", "1", {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 31536000,
      });
    }
    return res;
  } catch (err) {
    console.error("Google callback error:", err);
    return NextResponse.redirect(
      new URL("/?error=google_failed", request.url)
    );
  }
}
