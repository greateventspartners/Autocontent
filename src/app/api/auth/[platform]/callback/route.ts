import {
  isValidPlatform,
  validateOAuthState,
  requireAuth,
  upsertPlatformConnection,
} from "@/lib/oauth";
import { exchangeCodeForToken as exchangeLinkedIn, getUserInfo as getLinkedInUser } from "@/lib/linkedin";
import { exchangeFacebookCodeForToken, getFacebookUserInfo, getFacebookPages } from "@/lib/facebook";
import { exchangeTikTokCodeForToken, getTikTokUserInfo } from "@/lib/tiktok";
import { exchangePinterestCodeForToken, getPinterestUserInfo } from "@/lib/pinterest";
import { exchangeYouTubeCodeForToken, getYouTubeUserInfo } from "@/lib/youtube";
import { exchangeWordPressCodeForToken, getWordPressUserInfo } from "@/lib/wordpress";
import { exchangeMediumCodeForToken, getMediumUserInfo } from "@/lib/medium";

interface PlatformHandler {
  exchangeCode: (code: string) => Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
  }>;
  getUserInfo: (accessToken: string) => Promise<{
    id: string;
    name?: string;
    username?: string;
  }>;
}

const platformHandlers: Record<string, PlatformHandler> = {
  linkedin: {
    exchangeCode: async (code) => {
      const data = await exchangeLinkedIn(code);
      return { accessToken: data.accessToken, refreshToken: data.refreshToken, expiresIn: data.expiresIn };
    },
    getUserInfo: async (token) => {
      const info = await getLinkedInUser(token);
      return { id: info.sub, name: info.name };
    },
  },
  facebook: {
    exchangeCode: async (code) => {
      const data = await exchangeFacebookCodeForToken(code);
      return { accessToken: data.accessToken, expiresIn: data.expiresIn };
    },
    getUserInfo: async (token) => {
      const info = await getFacebookUserInfo(token);
      return { id: info.id, name: info.name };
    },
  },
  tiktok: {
    exchangeCode: async (code) => {
      const data = await exchangeTikTokCodeForToken(code);
      return { accessToken: data.accessToken, refreshToken: data.refreshToken, expiresIn: data.expiresIn };
    },
    getUserInfo: async (token) => {
      const info = await getTikTokUserInfo(token);
      return { id: info.openId, name: info.displayName };
    },
  },
  pinterest: {
    exchangeCode: async (code) => {
      const data = await exchangePinterestCodeForToken(code);
      return { accessToken: data.accessToken, expiresIn: data.expiresIn };
    },
    getUserInfo: async (token) => {
      const info = await getPinterestUserInfo(token);
      return { id: info.id, name: info.username };
    },
  },
  youtube: {
    exchangeCode: async (code) => {
      const data = await exchangeYouTubeCodeForToken(code);
      return { accessToken: data.accessToken, refreshToken: data.refreshToken, expiresIn: data.expiresIn };
    },
    getUserInfo: async (token) => {
      const info = await getYouTubeUserInfo(token);
      return { id: info.id, name: info.name };
    },
  },
  wordpress: {
    exchangeCode: async (code) => {
      const data = await exchangeWordPressCodeForToken(code);
      return {
        accessToken: data.accessToken,
        expiresIn: data.expiresIn,
      };
    },
    getUserInfo: async (token) => {
      const info = await getWordPressUserInfo(token);
      return { id: String(info.id), name: info.display_name };
    },
  },
  medium: {
    exchangeCode: async (code) => {
      const data = await exchangeMediumCodeForToken(code);
      return { accessToken: data.accessToken, refreshToken: data.refreshToken, expiresIn: data.expiresIn };
    },
    getUserInfo: async (token) => {
      const info = await getMediumUserInfo(token);
      return { id: info.id, name: info.username };
    },
  },
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;

  if (!isValidPlatform(platform)) {
    return Response.redirect(new URL("/settings?error=unknown_platform", request.url));
  }

  const { error: authError, session, workspaceId } = await requireAuth();
  if (authError) {
    return Response.redirect(new URL("/?error=auth_required", request.url));
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return Response.redirect(new URL(`/settings?error=${platform}_denied`, request.url));
  }

  if (!code || !state) {
    return Response.redirect(new URL(`/settings?error=${platform}_invalid`, request.url));
  }

  if (!validateOAuthState(request, platform, state)) {
    return Response.redirect(new URL(`/settings?error=${platform}_state_mismatch`, request.url));
  }

  if (!workspaceId) {
    return Response.redirect(new URL("/settings?error=no_workspace", request.url));
  }

  const handler = platformHandlers[platform];
  if (!handler) {
    return Response.redirect(new URL(`/settings?error=${platform}_unsupported`, request.url));
  }

  try {
    const tokenData = await handler.exchangeCode(code);
    const userInfo = await handler.getUserInfo(tokenData.accessToken);

    await upsertPlatformConnection({
      workspaceId,
      platform,
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      expiresIn: tokenData.expiresIn,
      platformUserId: userInfo.id,
      platformUserName: userInfo.name ?? userInfo.username,
    });

    return Response.redirect(new URL(`/settings?${platform}=connected`, request.url));
  } catch (err) {
    console.error(`${platform} callback error:`, err);
    return Response.redirect(new URL(`/settings?error=${platform}_failed`, request.url));
  }
}
