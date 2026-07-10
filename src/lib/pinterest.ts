const PINTEREST_AUTH_URL = "https://www.pinterest.com/oauth/";
const PINTEREST_TOKEN_URL = "https://api.pinterest.com/v5/oauth/token";
const PINTEREST_API_URL = "https://api.pinterest.com/v5";

export function getPinterestConfig() {
  const clientId = process.env.PINTEREST_APP_ID;
  const clientSecret = process.env.PINTEREST_APP_SECRET;
  const redirectUri = process.env.PINTEREST_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("PINTEREST_APP_ID, PINTEREST_APP_SECRET et PINTEREST_REDIRECT_URI sont requis dans .env");
  }

  return { clientId, clientSecret, redirectUri };
}

export function getPinterestAuthorizationUrl(state: string): string {
  const { clientId, redirectUri } = getPinterestConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: "boards:read,pins:read,pins:write,boards:write",
    response_type: "code",
  });
  return `${PINTEREST_AUTH_URL}?${params.toString()}`;
}

export async function exchangePinterestCodeForToken(code: string): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  const { clientId, clientSecret, redirectUri } = getPinterestConfig();

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(PINTEREST_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${auth}`,
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Pinterest token exchange failed: ${error}`);
  }

  const data = await res.json() as { access_token: string; expires_in: number };
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  };
}

export async function getPinterestUserInfo(accessToken: string): Promise<{
  id: string;
  username: string;
  profile?: { first_name?: string; last_name?: string };
}> {
  const res = await fetch(`${PINTEREST_API_URL}/user_account`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch Pinterest user info");
  }

  return res.json();
}

export async function getPinterestBoards(accessToken: string): Promise<
  Array<{ id: string; name: string }>
> {
  const res = await fetch(`${PINTEREST_API_URL}/boards?page_size=50`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch Pinterest boards");
  }

  const data = await res.json() as { items: Array<{ id: string; name: string }> };
  return data.items || [];
}

export async function createPinterestPin(
  accessToken: string,
  boardId: string,
  title: string,
  description: string,
  link?: string
): Promise<{ id: string }> {
  const res = await fetch(`${PINTEREST_API_URL}/pins`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      board_id: boardId,
      title,
      description,
      link: link || undefined,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Pinterest pin creation failed: ${error}`);
  }

  return res.json();
}
