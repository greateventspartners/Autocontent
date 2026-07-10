import type { PublishInput, PublishResult } from "./types";

const THREADS_API_URL = "https://graph.threads.net/v1.0";

export async function publishToThreads(input: PublishInput): Promise<PublishResult> {
  const { connection, body } = input;

  if (!connection?.accessToken || !connection.platformUserId) {
    return {
      ok: false,
      error: "Compte Threads non connecté (via Instagram).",
      composerUrl: "https://threads.net/",
    };
  }

  try {
    const createRes = await fetch(
      `${THREADS_API_URL}/${connection.platformUserId}/threads`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: body,
          access_token: connection.accessToken,
        }),
      }
    );

    if (!createRes.ok) {
      const error = await createRes.text();
      throw new Error(`Threads container creation failed: ${error}`);
    }

    const container = (await createRes.json()) as { id: string };

    const publishRes = await fetch(`${THREADS_API_URL}/${connection.platformUserId}/threads_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: container.id,
        access_token: connection.accessToken,
      }),
    });

    if (!publishRes.ok) {
      const error = await publishRes.text();
      throw new Error(`Threads publish failed: ${error}`);
    }

    const result = (await publishRes.json()) as { id: string };

    return {
      ok: true,
      platformPostId: result.id,
      url: `https://www.threads.net/@${connection.platformUserId}/post/${result.id}`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return {
      ok: false,
      error: `Échec de la publication Threads. ${message}`.trim(),
      composerUrl: "https://threads.net/",
    };
  }
}
