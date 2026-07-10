const IG_GRAPH_URL = "https://graph.facebook.com/v19.0";

export async function getInstagramAccounts(accessToken: string): Promise<
  Array<{ id: string; name: string; username: string }>
> {
  const res = await fetch(
    `${IG_GRAPH_URL}/me/accounts?fields=id,name,instagram_business_account{id,username}&access_token=${accessToken}`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch Instagram accounts");
  }

  const data = await res.json() as {
    data: Array<{
      id: string;
      name: string;
      instagram_business_account?: { id: string; username: string };
    }>;
  };

  return data.data
    .filter((page) => page.instagram_business_account)
    .map((page) => ({
      id: page.instagram_business_account!.id,
      name: page.name,
      username: page.instagram_business_account!.username,
    }));
}

export async function postToInstagram(
  accessToken: string,
  igUserId: string,
  caption: string
): Promise<{ id: string }> {
  const res = await fetch(`${IG_GRAPH_URL}/${igUserId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      caption,
      access_token: accessToken,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Instagram media creation failed: ${error}`);
  }

  const media = (await res.json()) as { id: string };

  const publishRes = await fetch(`${IG_GRAPH_URL}/${igUserId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      creation_id: media.id,
      access_token: accessToken,
    }),
  });

  if (!publishRes.ok) {
    const error = await publishRes.text();
    throw new Error(`Instagram publish failed: ${error}`);
  }

  return publishRes.json();
}
