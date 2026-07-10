import { postYouTubeCommunityPost } from "@/lib/youtube";
import type { PublishInput, PublishResult } from "./types";

export async function publishToYouTube(input: PublishInput): Promise<PublishResult> {
  const { connection, body } = input;

  if (!connection?.accessToken) {
    return {
      ok: false,
      error: "Compte YouTube non connecté.",
      composerUrl: "https://www.youtube.com",
    };
  }

  try {
    const result = await postYouTubeCommunityPost(connection.accessToken, body);
    return {
      ok: true,
      platformPostId: result.id,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return {
      ok: false,
      error: `Échec de la publication YouTube (post communautaire). ${message}`.trim(),
      composerUrl: "https://www.youtube.com",
    };
  }
}
