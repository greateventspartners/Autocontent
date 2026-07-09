import type { PublishInput, PublishResult } from "./types";

const LINKEDIN_UGC_URL = "https://api.linkedin.com/v2/ugcPosts";

export async function publishToLinkedIn(input: PublishInput): Promise<PublishResult> {
  const { connection, body } = input;

  if (!connection?.accessToken || !connection.platformUserId) {
    return {
      ok: false,
      error: "Compte LinkedIn non connecté.",
      composerUrl: "https://www.linkedin.com/feed/",
    };
  }

  const author = connection.platformUserId.startsWith("urn:li:")
    ? connection.platformUserId
    : `urn:li:person:${connection.platformUserId}`;

  const res = await fetch(LINKEDIN_UGC_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${connection.accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: body },
          shareMediaCategory: "NONE",
        },
      },
      visibility: { "com.linkedin.visibility": "PUBLIC" },
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return {
      ok: false,
      error: `Échec de la publication LinkedIn (${res.status}). ${detail}`.trim(),
      composerUrl: "https://www.linkedin.com/feed/",
    };
  }

  const id = res.headers.get("x-restli-id") ?? undefined;
  return {
    ok: true,
    platformPostId: id,
    url: id ? `https://www.linkedin.com/feed/update/${id}` : undefined,
  };
}
