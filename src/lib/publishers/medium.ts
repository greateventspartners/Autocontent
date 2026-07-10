import { postToMedium } from "@/lib/medium";
import type { PublishInput, PublishResult } from "./types";

export async function publishToMedium(input: PublishInput): Promise<PublishResult> {
  const { connection, body } = input;

  if (!connection?.accessToken) {
    return {
      ok: false,
      error: "Compte Medium non connecté.",
      composerUrl: "https://medium.com/new-story",
    };
  }

  try {
    const title = body.split("\n")[0].slice(0, 100);
    const result = await postToMedium(
      connection.accessToken,
      title,
      body,
      "markdown",
      "public"
    );

    return {
      ok: true,
      platformPostId: result.id,
      url: result.url,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return {
      ok: false,
      error: `Échec de la publication Medium. ${message}`.trim(),
      composerUrl: "https://medium.com/new-story",
    };
  }
}
