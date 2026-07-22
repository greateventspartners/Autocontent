import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  exchangeFacebookCodeForToken,
  getFacebookUserInfo,
  getFacebookPages,
} from "@/lib/facebook";

export async function GET(request: NextRequest) {
  const session = await getSession(request);

    if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL("/settings?error=facebook_denied", request.url),
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/settings?error=facebook_missing_params", request.url),
    );
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get("facebook_oauth_state")?.value;

  if (!savedState || savedState !== state) {
    return NextResponse.redirect(
      new URL("/settings?error=facebook_invalid_state", request.url),
    );
  }

  cookieStore.delete("facebook_oauth_state");

  try {
    const { accessToken } = await exchangeFacebookCodeForToken(code);
    const userInfo = await getFacebookUserInfo(accessToken);
    const pages = await getFacebookPages(accessToken);

    const workspaceMember = await prisma.workspaceMember.findFirst({
      where: { userId: session.userId },
    });

    if (!workspaceMember) {
      return NextResponse.redirect(
        new URL("/settings?error=facebook_no_workspace", request.url),
      );
    }

    const pageInfo = pages?.[0] ?? null;

    await prisma.platformConnection.upsert({
      where: {
        workspaceId_platform: {
          workspaceId: workspaceMember.workspaceId,
          platform: "facebook",
        },
      },
      update: {
        accessToken,
        platformUserId: pageInfo ? JSON.stringify(pageInfo) : userInfo.id,
        updatedAt: new Date(),
      },
      create: {
        workspaceId: workspaceMember.workspaceId,
        platform: "facebook",
        accessToken,
        platformUserId: pageInfo ? JSON.stringify(pageInfo) : userInfo.id,
      },
    });

    return NextResponse.redirect(
      new URL("/settings?facebook=connected", request.url),
    );
  } catch (err) {
    console.error("Facebook OAuth callback error:", err);
    return NextResponse.redirect(
      new URL("/settings?error=facebook_callback_failed", request.url),
    );
  }
}
