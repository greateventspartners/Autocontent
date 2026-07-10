import { postToFacebookUser } from "@/lib/facebook";
import type { PublishInput, PublishResult } from "./types";

export async function publishToFacebook(input: PublishInput): Promise<PublishResult> {
  const { connection, body } = input;

  if (!connection?.accessToken) {
    return {
      ok: false,
      error: "Compte Facebook non connecté.",
      composerUrl: "https://www.facebook.com/",
    };
  }

  try {
    const result = await postToFacebookUser(connection.accessToken, body);
    return {
      ok: true,
      platformPostId: result.id,
      url: `https://www.facebook.com/${result.id}`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return {
      ok: false,
      error: `Échec de la publication Facebook. ${message}`.trim(),
      composerUrl: "https://www.facebook.com/",
    };
  }
}
