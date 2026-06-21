import type { PublishAdapter } from "./types";

export const mediumAdapter: PublishAdapter = {
  name: "medium",
  validate(config) {
    if (!config.accessToken) return "Missing Medium accessToken";
    if (!config.authorId) return "Missing Medium authorId";
    return null;
  },
  async publish({ config, title, content }) {
    try {
      const res = await fetch(
        `https://api.medium.com/v1/users/${config.authorId}/posts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.accessToken}`,
          },
          body: JSON.stringify({
            title,
            contentFormat: "markdown",
            content,
            publishStatus: config.publishStatus || "draft",
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        return {
          success: false,
          error: `Medium API error: ${data.errors?.[0]?.message || res.status}`,
        };
      }

      return {
        success: true,
        externalUrl: data.data.url,
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },
};
