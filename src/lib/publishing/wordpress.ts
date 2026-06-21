import type { PublishAdapter } from "./types";

export const wordpressAdapter: PublishAdapter = {
  name: "wordpress",
  validate(config) {
    if (!config.siteUrl) return "Missing siteUrl";
    if (!config.username) return "Missing username";
    if (!config.appPassword) return "Missing appPassword";
    return null;
  },
  async publish({ config, title, content }) {
    try {
      const res = await fetch(
        `${config.siteUrl}/wp-json/wp/v2/posts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${Buffer.from(
              `${config.username}:${config.appPassword}`
            ).toString("base64")}`,
          },
          body: JSON.stringify({
            title,
            content,
            status: "draft",
          }),
        }
      );
      if (!res.ok) {
        const err = await res.text();
        return { success: false, error: `WordPress API error: ${err}` };
      }
      const post = await res.json();
      return { success: true, externalUrl: post.link };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },
};
