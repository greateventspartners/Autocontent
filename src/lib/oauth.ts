import crypto from "crypto";
import { getSession } from "./auth";
import { prisma } from "./prisma";

const VALID_PLATFORMS = [
  "linkedin",
  "facebook",
  "tiktok",
  "pinterest",
  "youtube",
  "wordpress",
  "medium",
] as const;

export type Platform = (typeof VALID_PLATFORMS)[number];

export function isValidPlatform(p: string): p is Platform {
  return (VALID_PLATFORMS as readonly string[]).includes(p);
}

export function generateOAuthState(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function setOAuthStateCookie(
  platform: string,
  state: string
): string {
  return `${platform}_oauth_state=${state}; HttpOnly; SameSite=Lax; Path=/; Max-Age=600`;
}

export function validateOAuthState(
  request: Request,
  platform: string,
  state: string | null
): boolean {
  if (!state) return false;
  const cookieState = request.headers
    .get("cookie")
    ?.split(";")
    .find((c) => c.trim().startsWith(`${platform}_oauth_state=`))
    ?.split("=")[1];
  return cookieState === state;
}

export async function getWorkspaceForUser(userId: string) {
  const member = await prisma.workspaceMember.findFirst({
    where: { userId },
  });
  return member?.workspaceId ?? null;
}

export async function requireAuth(request?: Request) {
  const session = await getSession(request);
  if (!session) {
    return { error: "Non authentifié" as const, session: null, workspaceId: null };
  }
  const workspaceId = await getWorkspaceForUser(session.userId);
  return { error: null, session, workspaceId };
}

export async function upsertPlatformConnection(params: {
  workspaceId: string;
  platform: string;
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  platformUserId: string;
  platformUserName?: string;
}) {
  const { workspaceId, platform, accessToken, refreshToken, expiresIn, platformUserId, platformUserName } = params;
  const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : undefined;

  await prisma.platformConnection.upsert({
    where: { workspaceId_platform: { workspaceId, platform } },
    update: {
      accessToken,
      ...(refreshToken && { refreshToken }),
      ...(expiresAt && { tokenExpiresAt: expiresAt }),
      platformUserId,
      ...(platformUserName && { platformUserName }),
    },
    create: {
      workspaceId,
      platform,
      accessToken,
      ...(refreshToken && { refreshToken }),
      ...(expiresAt && { tokenExpiresAt: expiresAt }),
      platformUserId,
      ...(platformUserName && { platformUserName }),
    },
  });
}

export async function deletePlatformConnection(workspaceId: string, platform: string) {
  await prisma.platformConnection.deleteMany({
    where: { workspaceId, platform },
  });
}
