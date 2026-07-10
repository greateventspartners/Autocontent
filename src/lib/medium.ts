const MEDIUM_AUTH_URL = "https://medium.com/m/oauth/authorize";
const MEDIUM_TOKEN_URL = "https://medium.com/m/oauth/token";
const MEDIUM_API_URL = "https://api.medium.com/v1";

export function getMediumConfig() {
  const clientId = process.env.MEDIUM_CLIENT_ID;
  const clientSecret = process.env.MEDIUM_CLIENT_SECRET;
  const redirectUri = process.env.MEDIUM_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("MEDIUM_CLIENT_ID, MEDIUM_CLIENT_SECRET et MEDIUM_REDIRECT_URI sont requis dans .env");
  }

  return { clientId, clientSecret, redirectUri };
}

export function getMediumAuthorizationUrl(state: string): string {
  const { clientId, redirectUri } = getMediumConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: "basic_profile,publish_post",
    response_type: "code",
  });
  return `${MEDIUM_AUTH_URL}?${params.toString()}`;
}

export async function exchangeMediumCodeForToken(code: string): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}> {
  const { clientId, clientSecret, redirectUri } = getMediumConfig();

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(MEDIUM_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Medium token exchange failed: ${error}`);
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

export async function getMediumUserInfo(accessToken: string): Promise<{
  id: string;
  name: string;
  username: string;
  url: string;
}> {
  const res = await fetch(`${MEDIUM_API_URL}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch Medium user info");
  }

  const data = await res.json() as { data: { id: string; name: string; username: string; url: string } };
  return data.data;
}

export async function postToMedium(
  accessToken: string,
  title: string,
  content: string,
  contentFormat: "html" | "markdown" = "markdown",
  publishStatus: "public" | "draft" | "unlisted" = "public",
  tags?: string[]
): Promise<{ id: string; url: string }> {
  const res = await fetch(`${MEDIUM_API_URL}/posts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
      contentFormat,
      content,
      publishStatus,
      tags: tags || [],
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Medium post failed: ${error}`);
  }

  const data = await res.json() as { data: { id: string; url: string } };
  return data.data;
}
