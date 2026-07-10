import { exchangeMediumCodeForToken, getMediumUserInfo } from "@/lib/medium";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.redirect(new URL("/?error=auth_required", request.url));
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return Response.redirect(new URL("/settings?error=medium_denied", request.url));
  }

  if (!code || !state) {
    return Response.redirect(new URL("/settings?error=medium_invalid", request.url));
  }

  const cookieState = request.headers.get("cookie")
    ?.split(";")
    .find((c) => c.trim().startsWith("medium_oauth_state="))
    ?.split("=")[1];

  if (cookieState !== state) {
    return Response.redirect(new URL("/settings?error=medium_state_mismatch", request.url));
  }

  try {
    const tokenData = await exchangeMediumCodeForToken(code);
    const userInfo = await getMediumUserInfo(tokenData.accessToken);

    const workspaceId = await prisma.workspaceMember.findFirst({
      where: { userId: session.userId },
    }).then((m) => m?.workspaceId);

    if (!workspaceId) {
      return Response.redirect(new URL("/settings?error=no_workspace", request.url));
    }

    const expiresAt = new Date(Date.now() + tokenData.expiresIn * 1000);

    await prisma.platformConnection.upsert({
      where: {
        workspaceId_platform: { workspaceId, platform: "medium" },
      },
      update: {
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        tokenExpiresAt: expiresAt,
        platformUserId: userInfo.id,
        platformUserName: userInfo.username,
      },
      create: {
        workspaceId,
        platform: "medium",
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        tokenExpiresAt: expiresAt,
        platformUserId: userInfo.id,
        platformUserName: userInfo.username,
      },
    });

    return Response.redirect(new URL("/settings?medium=connected", request.url));
  } catch (err) {
    console.error("Medium callback error:", err);
    return Response.redirect(new URL("/settings?error=medium_failed", request.url));
  }
}
