import type { PublishAdapter } from "./types";

export const tiktokAdapter: PublishAdapter = {
  name: "tiktok",
  validate(config) {
    if (!config.accessToken) return "Missing TikTok accessToken";
    return null;
  },
  async publish({ config, title, content }) {
    try {
      const text = `${title}\n\n${content.substring(0, 2000)}`.substring(
        0,
        2200
      );

      const res = await fetch(
        "https://open.tiktokapis.com/v2/content/publish/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.accessToken}`,
          },
          body: JSON.stringify({
            title: text,
            privacy_level: "PUBLIC",
            disable_comment: false,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        return {
          success: false,
          error: `TikTok API error: ${data.error?.message || data.message || res.status}`,
        };
      }

      return {
        success: true,
        externalUrl: `https://tiktok.com/upload/${data.data?.id || ""}`,
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },
};
