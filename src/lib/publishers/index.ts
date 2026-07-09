import { publishToLinkedIn } from "./linkedin";
import { getComposerUrl } from "./composers";
import type { PublishInput, PublishResult } from "./types";

export type { PublishInput, PublishResult } from "./types";
export { getComposerUrl } from "./composers";

export async function publishPost(input: PublishInput): Promise<PublishResult> {
  if (input.platform.toLowerCase() === "linkedin") {
    return publishToLinkedIn(input);
  }

  return {
    ok: false,
    error:
      "Publication automatique non disponible pour cette plateforme. Copiez le contenu et ouvrez le composeur.",
    composerUrl: getComposerUrl(input.platform, input.body),
  };
}
