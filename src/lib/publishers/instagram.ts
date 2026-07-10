import { postToInstagram } from "@/lib/instagram";
import type { PublishInput, PublishResult } from "./types";

export async function publishToInstagram(input: PublishInput): Promise<PublishResult> {
  const { connection, body } = input;

  if (!connection?.accessToken || !connection.platformUserId) {
    return {
      ok: false,
      error: "Compte Instagram non connecté.",
      composerUrl: "https://www.instagram.com/",
    };
  }

  try {
    const result = await postToInstagram(
      connection.accessToken,
      connection.platformUserId,
      body
    );
    return {
      ok: true,
      platformPostId: result.id,
      url: `https://www.instagram.com/p/${result.id}`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return {
      ok: false,
      error: `Échec de la publication Instagram. ${message}`.trim(),
      composerUrl: "https://www.instagram.com/",
    };
  }
}
