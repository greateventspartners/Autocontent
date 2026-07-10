import { exchangeWordPressCodeForToken, getWordPressUserInfo } from "@/lib/wordpress";
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
    return Response.redirect(new URL("/settings?error=wordpress_denied", request.url));
  }

  if (!code || !state) {
    return Response.redirect(new URL("/settings?error=wordpress_invalid", request.url));
  }

  const cookieState = request.headers.get("cookie")
    ?.split(";")
    .find((c) => c.trim().startsWith("wordpress_oauth_state="))
    ?.split("=")[1];

  if (cookieState !== state) {
    return Response.redirect(new URL("/settings?error=wordpress_state_mismatch", request.url));
  }

  try {
    const tokenData = await exchangeWordPressCodeForToken(code);
    const userInfo = await getWordPressUserInfo(tokenData.accessToken);

    const workspaceId = await prisma.workspaceMember.findFirst({
      where: { userId: session.userId },
    }).then((m) => m?.workspaceId);

    if (!workspaceId) {
      return Response.redirect(new URL("/settings?error=no_workspace", request.url));
    }

    await prisma.platformConnection.upsert({
      where: {
        workspaceId_platform: { workspaceId, platform: "wordpress" },
      },
      update: {
        accessToken: tokenData.accessToken,
        tokenExpiresAt: new Date(Date.now() + tokenData.expiresIn * 1000),
        platformUserId: tokenData.blogId ?? String(userInfo.id),
        platformUserName: tokenData.blogUrl ?? userInfo.display_name,
      },
      create: {
        workspaceId,
        platform: "wordpress",
        accessToken: tokenData.accessToken,
        tokenExpiresAt: new Date(Date.now() + tokenData.expiresIn * 1000),
        platformUserId: tokenData.blogId ?? String(userInfo.id),
        platformUserName: tokenData.blogUrl ?? userInfo.display_name,
      },
    });

    return Response.redirect(new URL("/settings?wordpress=connected", request.url));
  } catch (err) {
    console.error("WordPress callback error:", err);
    return Response.redirect(new URL("/settings?error=wordpress_failed", request.url));
  }
}
