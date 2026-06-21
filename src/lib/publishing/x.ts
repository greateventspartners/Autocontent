import type { PublishAdapter } from "./types";

export const xAdapter: PublishAdapter = {
  name: "x",
  validate(config) {
    if (!config.accessToken) return "Missing X accessToken (OAuth 2.0 Bearer)";
    return null;
  },
  async publish({ config, content, title }) {
    try {
      const text = `${title}\n\n${content.substring(0, 4000)}`.substring(
        0,
        4000
      );

      const res = await fetch(
        "https://api.twitter.com/2/tweets",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.accessToken}`,
          },
          body: JSON.stringify({ text }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        return {
          success: false,
          error: `X API error: ${data.detail || data.title || JSON.stringify(data)}`,
        };
      }

      return {
        success: true,
        externalUrl: `https://x.com/user/status/${data.data.id}`,
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },
};
