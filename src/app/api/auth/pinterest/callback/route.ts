import { exchangePinterestCodeForToken, getPinterestUserInfo } from "@/lib/pinterest";
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
    return Response.redirect(new URL("/settings?error=pinterest_denied", request.url));
  }

  if (!code || !state) {
    return Response.redirect(new URL("/settings?error=pinterest_invalid", request.url));
  }

  const cookieState = request.headers.get("cookie")
    ?.split(";")
    .find((c) => c.trim().startsWith("pinterest_oauth_state="))
    ?.split("=")[1];

  if (cookieState !== state) {
    return Response.redirect(new URL("/settings?error=pinterest_state_mismatch", request.url));
  }

  try {
    const tokenData = await exchangePinterestCodeForToken(code);
    const userInfo = await getPinterestUserInfo(tokenData.accessToken);

    const member = await prisma.workspaceMember.findFirst({
      where: { userId: session.userId },
    });
    const workspaceId = member?.workspaceId;

    if (!workspaceId) {
      return Response.redirect(new URL("/settings?error=no_workspace", request.url));
    }

    await prisma.platformConnection.upsert({
      where: {
        workspaceId_platform: { workspaceId, platform: "pinterest" },
      },
      update: {
        accessToken: tokenData.accessToken,
        platformUserId: userInfo.id,
        platformUserName: userInfo.username,
      },
      create: {
        workspaceId,
        platform: "pinterest",
        accessToken: tokenData.accessToken,
        platformUserId: userInfo.id,
        platformUserName: userInfo.username,
      },
    });

    return Response.redirect(new URL("/settings?pinterest=connected", request.url));
  } catch (err) {
    console.error("Pinterest callback error:", err);
    return Response.redirect(new URL("/settings?error=pinterest_failed", request.url));
  }
}
