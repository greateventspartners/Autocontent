import { exchangeYouTubeCodeForToken, getYouTubeUserInfo } from "@/lib/youtube";
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
    return Response.redirect(new URL("/settings?error=youtube_denied", request.url));
  }

  if (!code || !state) {
    return Response.redirect(new URL("/settings?error=youtube_invalid", request.url));
  }

  const cookieState = request.headers.get("cookie")
    ?.split(";")
    .find((c) => c.trim().startsWith("youtube_oauth_state="))
    ?.split("=")[1];

  if (cookieState !== state) {
    return Response.redirect(new URL("/settings?error=youtube_state_mismatch", request.url));
  }

  try {
    const tokenData = await exchangeYouTubeCodeForToken(code);
    const userInfo = await getYouTubeUserInfo(tokenData.accessToken);

    const member = await prisma.workspaceMember.findFirst({
      where: { userId: session.userId },
    });
    const workspaceId = member?.workspaceId;

    if (!workspaceId) {
      return Response.redirect(new URL("/settings?error=no_workspace", request.url));
    }

    const expiresAt = new Date(Date.now() + tokenData.expiresIn * 1000);

    await prisma.platformConnection.upsert({
      where: {
        workspaceId_platform: { workspaceId, platform: "youtube" },
      },
      update: {
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        tokenExpiresAt: expiresAt,
        platformUserId: userInfo.id,
        platformUserName: userInfo.name,
      },
      create: {
        workspaceId,
        platform: "youtube",
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        tokenExpiresAt: expiresAt,
        platformUserId: userInfo.id,
        platformUserName: userInfo.name,
      },
    });

    return Response.redirect(new URL("/settings?youtube=connected", request.url));
  } catch (err) {
    console.error("YouTube callback error:", err);
    return Response.redirect(new URL("/settings?error=youtube_failed", request.url));
  }
}
