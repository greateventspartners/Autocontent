import type { PublishAdapter } from "./types";

export const linkedinAdapter: PublishAdapter = {
  name: "linkedin",
  validate(config) {
    if (!config.accessToken) return "Missing LinkedIn accessToken";
    if (!config.authorId) return "Missing LinkedIn authorId (URN)";
    return null;
  },
  async publish({ config, content, title }) {
    try {
      const body = {
        author: `urn:li:person:${config.authorId}`,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: {
              text: `${title}\n\n${content.substring(0, 3000)}`,
            },
            shareMediaCategory: "NONE",
          },
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
        },
      };

      const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.accessToken}`,
          "X-Restli-Protocol-Version": "2.0.0",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.text();
        return { success: false, error: `LinkedIn API error: ${err}` };
      }

      return { success: true, externalUrl: "https://linkedin.com/feed/" };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },
};
