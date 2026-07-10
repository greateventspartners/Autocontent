import { postToTikTok } from "@/lib/tiktok";
import type { PublishInput, PublishResult } from "./types";

export async function publishToTikTok(input: PublishInput): Promise<PublishResult> {
  const { connection, body } = input;

  if (!connection?.accessToken || !connection.platformUserId) {
    return {
      ok: false,
      error: "Compte TikTok non connecté.",
      composerUrl: "https://www.tiktok.com/upload",
    };
  }

  try {
    const result = await postToTikTok(
      connection.accessToken,
      connection.platformUserId,
      body
    );
    return {
      ok: true,
      platformPostId: result.videoId,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return {
      ok: false,
      error: `Échec de la publication TikTok. ${message}`.trim(),
      composerUrl: "https://www.tiktok.com/upload",
    };
  }
}
