const TIKTOK_AUTH_URL = "https://www.tiktok.com/v2/auth/authorize/";
const TIKTOK_TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
const TIKTOK_API_URL = "https://open.tiktokapis.com/v2";

export function getTikTokConfig() {
  const clientId = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  const redirectUri = process.env.TIKTOK_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET et TIKTOK_REDIRECT_URI sont requis dans .env");
  }

  return { clientId, clientSecret, redirectUri };
}

export function getTikTokAuthorizationUrl(state: string): string {
  const { clientId, redirectUri } = getTikTokConfig();
  const params = new URLSearchParams({
    client_key: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    state,
    scope: "user.info.basic,video.publish",
  });
  return `${TIKTOK_AUTH_URL}?${params.toString()}`;
}

export async function exchangeTikTokCodeForToken(code: string): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  openId: string;
}> {
  const { clientId, clientSecret, redirectUri } = getTikTokConfig();

  const body = new URLSearchParams({
    client_key: clientId,
    client_secret: clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  });

  const res = await fetch(TIKTOK_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`TikTok token exchange failed: ${error}`);
  }

  const data = await res.json() as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    open_id: string;
  };

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    openId: data.open_id,
  };
}

export async function refreshTikTokAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}> {
  const { clientId, clientSecret } = getTikTokConfig();

  const body = new URLSearchParams({
    client_key: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const res = await fetch(TIKTOK_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    throw new Error("TikTok token refresh failed");
  }

  const data = await res.json() as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

export async function getTikTokUserInfo(accessToken: string): Promise<{
  openId: string;
  displayName: string;
  avatarUrl: string;
}> {
  const res = await fetch(`${TIKTOK_API_URL}/user/info/?fields=display_name,avatar_url`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch TikTok user info");
  }

  const data = await res.json() as {
    data: { user: { open_id: string; display_name: string; avatar_url: string } };
  };

  return {
    openId: data.data.user.open_id,
    displayName: data.data.user.display_name,
    avatarUrl: data.data.user.avatar_url,
  };
}

export async function postToTikTok(accessToken: string, openId: string, caption: string): Promise<{ videoId: string }> {
  const res = await fetch(
    `${TIKTOK_API_URL}/post/publish/video/init/`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        post_info: { title: caption },
        source_info: { source: "PULL" },
      }),
    }
  );

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`TikTok video init failed: ${error}`);
  }

  const data = await res.json() as { data: { publish_id: string; upload_url: string } };
  return { videoId: data.data.publish_id };
}
