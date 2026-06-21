import type { PublishAdapter } from "./types";

export const instagramAdapter: PublishAdapter = {
  name: "instagram",
  validate(config) {
    if (!config.accessToken) return "Missing Instagram accessToken";
    if (!config.businessAccountId) return "Missing Instagram businessAccountId";
    return null;
  },
  async publish({ config, content, title }) {
    try {
      const caption = `${title}\n\n${content.substring(0, 2200)}`;
      const igUserId = config.businessAccountId;

      const mediaRes = await fetch(
        `https://graph.facebook.com/v21.0/${igUserId}/media`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image_url: config.imageUrl || "",
            caption,
            access_token: config.accessToken,
          }),
        }
      );

      const mediaData = await mediaRes.json();

      if (!mediaRes.ok) {
        return {
          success: false,
          error: `Instagram media error: ${mediaData.error?.message || mediaRes.status}`,
        };
      }

      const publishRes = await fetch(
        `https://graph.facebook.com/v21.0/${igUserId}/media_publish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            creation_id: mediaData.id,
            access_token: config.accessToken,
          }),
        }
      );

      const publishData = await publishRes.json();

      if (!publishRes.ok) {
        return {
          success: false,
          error: `Instagram publish error: ${publishData.error?.message || publishRes.status}`,
        };
      }

      return {
        success: true,
        externalUrl: `https://instagram.com/p/${publishData.id}/`,
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },
};
