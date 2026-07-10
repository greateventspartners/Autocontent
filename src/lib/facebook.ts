const FB_AUTH_URL = "https://www.facebook.com/v19.0/dialog/oauth";
const FB_TOKEN_URL = "https://graph.facebook.com/v19.0/oauth/access_token";
const FB_GRAPH_URL = "https://graph.facebook.com/v19.0";

export function getFacebookConfig() {
  const clientId = process.env.FACEBOOK_APP_ID;
  const clientSecret = process.env.FACEBOOK_APP_SECRET;
  const redirectUri = process.env.FACEBOOK_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("FACEBOOK_APP_ID, FACEBOOK_APP_SECRET et FACEBOOK_REDIRECT_URI sont requis dans .env");
  }

  return { clientId, clientSecret, redirectUri };
}

export function getFacebookAuthorizationUrl(state: string): string {
  const { clientId, redirectUri } = getFacebookConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: "public_profile,email,pages_show_list,pages_read_engagement,pages_manage_posts,pages_read_user_content",
    response_type: "code",
  });
  return `${FB_AUTH_URL}?${params.toString()}`;
}

export async function exchangeFacebookCodeForToken(code: string): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  const { clientId, clientSecret, redirectUri } = getFacebookConfig();

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    code,
  });

  const res = await fetch(`${FB_TOKEN_URL}?${params.toString()}`);

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Facebook token exchange failed: ${error}`);
  }

  const data = await res.json() as { access_token: string; expires_in: number };
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  };
}

export async function getFacebookUserInfo(accessToken: string): Promise<{
  id: string;
  name: string;
  email?: string;
}> {
  const res = await fetch(`${FB_GRAPH_URL}/me?fields=id,name,email&access_token=${accessToken}`);

  if (!res.ok) {
    throw new Error("Failed to fetch Facebook user info");
  }

  return res.json();
}

export async function getFacebookPages(accessToken: string): Promise<
  Array<{ id: string; name: string; access_token: string }>
> {
  const res = await fetch(`${FB_GRAPH_URL}/me/accounts?access_token=${accessToken}`);

  if (!res.ok) {
    throw new Error("Failed to fetch Facebook pages");
  }

  const data = await res.json() as { data: Array<{ id: string; name: string; access_token: string }> };
  return data.data;
}

export async function postToFacebookPage(
  pageAccessToken: string,
  pageId: string,
  message: string
): Promise<{ id: string }> {
  const res = await fetch(`${FB_GRAPH_URL}/${pageId}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, access_token: pageAccessToken }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Facebook post failed: ${error}`);
  }

  return res.json();
}

export async function postToFacebookUser(
  accessToken: string,
  message: string
): Promise<{ id: string }> {
  const res = await fetch(`${FB_GRAPH_URL}/me/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, access_token: accessToken }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Facebook user post failed: ${error}`);
  }

  return res.json();
}
