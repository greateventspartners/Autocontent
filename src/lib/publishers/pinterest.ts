import type { PublishInput, PublishResult } from "./types";

const PINTEREST_API_URL = "https://api.pinterest.com/v5";

export async function publishToPinterest(input: PublishInput): Promise<PublishResult> {
  const { connection, body } = input;

  if (!connection?.accessToken) {
    return {
      ok: false,
      error: "Compte Pinterest non connecté.",
      composerUrl: "https://pin.it/upload",
    };
  }

  try {
    const boardsRes = await fetch(`${PINTEREST_API_URL}/boards?page_size=1`, {
      headers: { Authorization: `Bearer ${connection.accessToken}` },
    });

    if (!boardsRes.ok) {
      throw new Error("Impossible de récupérer les tableaux Pinterest");
    }

    const boardsData = (await boardsRes.json()) as {
      items?: Array<{ id: string; name: string }>;
    };

    if (!boardsData.items?.length) {
      return {
        ok: false,
        error: "Aucun tableau Pinterest trouvé. Créez un tableau d'abord.",
        composerUrl: "https://pin.it/upload",
      };
    }

    const boardId = boardsData.items[0].id;

    const pinRes = await fetch(`${PINTEREST_API_URL}/pins`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${connection.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        board_id: boardId,
        title: body.slice(0, 100),
        description: body,
      }),
    });

    if (!pinRes.ok) {
      const error = await pinRes.text();
      throw new Error(`Pinterest pin creation failed: ${error}`);
    }

    const pin = (await pinRes.json()) as { id: string };

    return {
      ok: true,
      platformPostId: pin.id,
      url: `https://pinterest.com/pin/${pin.id}`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return {
      ok: false,
      error: `Échec de la publication Pinterest. ${message}`.trim(),
      composerUrl: "https://pin.it/upload",
    };
  }
}
