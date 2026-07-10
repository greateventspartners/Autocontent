import { publishToLinkedIn } from "./linkedin";
import { publishToFacebook } from "./facebook";
import { publishToInstagram } from "./instagram";
import { publishToThreads } from "./threads";
import { publishToTikTok } from "./tiktok";
import { publishToPinterest } from "./pinterest";
import { publishToYouTube } from "./youtube";
import { publishToWordPressSite } from "./wordpress";
import { publishToMedium } from "./medium";
import { getComposerUrl } from "./composers";
import type { PublishInput, PublishResult } from "./types";

export type { PublishInput, PublishResult } from "./types";
export { getComposerUrl } from "./composers";

export async function publishPost(input: PublishInput): Promise<PublishResult> {
  const platform = input.platform.toLowerCase();

  switch (platform) {
    case "linkedin":
      return publishToLinkedIn(input);
    case "facebook":
      return publishToFacebook(input);
    case "instagram":
      return publishToInstagram(input);
    case "threads":
      return publishToThreads(input);
    case "tiktok":
      return publishToTikTok(input);
    case "pinterest":
      return publishToPinterest(input);
    case "youtube":
      return publishToYouTube(input);
    case "wordpress":
      return publishToWordPressSite(input);
    case "medium":
      return publishToMedium(input);
    default:
      return {
        ok: false,
        error:
          "Publication automatique non disponible pour cette plateforme. Copiez le contenu et ouvrez le composeur.",
        composerUrl: getComposerUrl(input.platform, input.body),
      };
  }
}
