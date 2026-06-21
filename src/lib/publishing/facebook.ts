import type { PublishAdapter } from "./types";

export const facebookAdapter: PublishAdapter = {
  name: "facebook",
  validate(config) {
    if (!config.accessToken) return "Missing Facebook accessToken";
    if (!config.pageId) return "Missing Facebook pageId";
    return null;
  },
  async publish({ config, content, title }) {
    try {
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${config.pageId}/feed`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: `${title}\n\n${content.substring(0, 5000)}`,
            access_token: config.accessToken,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        return {
          success: false,
          error: `Facebook API error: ${data.error?.message || res.status}`,
        };
      }

      return {
        success: true,
        externalUrl: `https://facebook.com/${config.pageId}/posts/${data.id}`,
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },
};
