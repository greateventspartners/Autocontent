const YT_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const YT_TOKEN_URL = "https://oauth2.googleapis.com/token";
const YT_API_URL = "https://www.googleapis.com/youtube/v3";

export function getYouTubeConfig() {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  const redirectUri = process.env.YOUTUBE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET et YOUTUBE_REDIRECT_URI sont requis dans .env");
  }

  return { clientId, clientSecret, redirectUri };
}

export function getYouTubeAuthorizationUrl(state: string): string {
  const { clientId, redirectUri } = getYouTubeConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: "https://www.googleapis.com/auth/youtube.force-ssl https://www.googleapis.com/auth/userinfo.profile",
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
  });
  return `${YT_AUTH_URL}?${params.toString()}`;
}

export async function exchangeYouTubeCodeForToken(code: string): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}> {
  const { clientId, clientSecret, redirectUri } = getYouTubeConfig();

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(YT_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`YouTube token exchange failed: ${error}`);
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

export async function refreshYouTubeAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}> {
  const { clientId, clientSecret } = getYouTubeConfig();

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(YT_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    throw new Error("YouTube token refresh failed");
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

export async function getYouTubeUserInfo(accessToken: string): Promise<{
  id: string;
  name: string;
  picture?: string;
}> {
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch YouTube user info");
  }

  return res.json();
}

export async function postYouTubeCommunityPost(
  accessToken: string,
  text: string
): Promise<{ id: string }> {
  const res = await fetch(
    `${YT_API_URL}/communityPosts?part=snippet`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        snippet: {
          contentDetails: {
            topLevelComment: {
              snippet: { textDisplay: text },
            },
          },
        },
      }),
    }
  );

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`YouTube community post failed: ${error}`);
  }

  const data = await res.json() as { id: string };
  return data;
}
