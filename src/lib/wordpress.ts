const WP_AUTH_URL = "https://public-api.wordpress.com/oauth2/authorize";
const WP_TOKEN_URL = "https://public-api.wordpress.com/oauth2/token";

export function getWordPressConfig() {
  const clientId = process.env.WORDPRESS_CLIENT_ID;
  const clientSecret = process.env.WORDPRESS_CLIENT_SECRET;
  const redirectUri = process.env.WORDPRESS_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("WORDPRESS_CLIENT_ID, WORDPRESS_CLIENT_SECRET et WORDPRESS_REDIRECT_URI sont requis dans .env");
  }

  return { clientId, clientSecret, redirectUri };
}

export function getWordPressAuthorizationUrl(state: string): string {
  const { clientId, redirectUri } = getWordPressConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: "global",
    response_type: "code",
  });
  return `${WP_AUTH_URL}?${params.toString()}`;
}

export async function exchangeWordPressCodeForToken(code: string): Promise<{
  accessToken: string;
  blogId?: string;
  blogUrl?: string;
  expiresIn: number;
}> {
  const { clientId, clientSecret, redirectUri } = getWordPressConfig();

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(WP_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`WordPress token exchange failed: ${error}`);
  }

  const data = await res.json() as {
    access_token: string;
    blog_id?: string;
    blog_url?: string;
    expires_in: number;
  };

  return {
    accessToken: data.access_token,
    blogId: data.blog_id,
    blogUrl: data.blog_url,
    expiresIn: data.expires_in,
  };
}

export async function getWordPressUserInfo(accessToken: string): Promise<{
  id: number;
  display_name: string;
  email?: string;
  profile_URL?: string;
}> {
  const res = await fetch("https://public-api.wordpress.com/rest/v1.1/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch WordPress user info");
  }

  return res.json();
}

export async function postToWordPress(
  accessToken: string,
  siteId: string,
  title: string,
  content: string,
  status: "publish" | "draft" = "publish"
): Promise<{ id: number; URL: string }> {
  const res = await fetch(
    `https://public-api.wordpress.com/rest/v1.1/sites/${siteId}/posts/new`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, content, status }),
    }
  );

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`WordPress post failed: ${error}`);
  }

  return res.json();
}
