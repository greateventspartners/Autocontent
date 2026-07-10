import { postToWordPress } from "@/lib/wordpress";
import type { PublishInput, PublishResult } from "./types";

export async function publishToWordPressSite(input: PublishInput): Promise<PublishResult> {
  const { connection, body } = input;

  if (!connection?.accessToken || !connection.platformUserId) {
    return {
      ok: false,
      error: "Compte WordPress non connecté.",
      composerUrl: "https://wordpress.com/post",
    };
  }

  try {
    const title = body.split("\n")[0].slice(0, 100);
    const result = await postToWordPress(
      connection.accessToken,
      connection.platformUserId,
      title,
      body,
      "publish"
    );

    return {
      ok: true,
      platformPostId: String(result.id),
      url: result.URL,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return {
      ok: false,
      error: `Échec de la publication WordPress. ${message}`.trim(),
      composerUrl: "https://wordpress.com/post",
    };
  }
}
