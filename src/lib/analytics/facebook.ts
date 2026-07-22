import type { PostMetrics } from "./index";

interface InsightsData {
  name: string;
  values: Array<{ value: number | Record<string, number> }>;
}

export async function fetchFacebookMetrics(
  accessToken: string,
  platformPostId: string
): Promise<PostMetrics> {
  const fields = [
    "insights.post_impressions",
    "insights.post_reactions_by_type_total",
    "insights.post_clicks",
    "insights.post_shares",
    "insights.post_impressions_unique",
  ].join(",");

  const url = `https://graph.facebook.com/v21.0/${platformPostId}?fields=${fields}&access_token=${accessToken}`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Facebook analytics error: ${res.status}`);
  }

  const data: any = await res.json();
  const insights = (data.insights?.data ?? []) as InsightsData[];

  const getValue = (name: string): number => {
    const insight = insights.find((i) => i.name === name);
    if (!insight || !insight.values?.[0]) return 0;
    const val = insight.values[0].value;
    return typeof val === "number" ? val : 0;
  };

  const getReactions = (): number => {
    const insight = insights.find(
      (i) => i.name === "insights.post_reactions_by_type_total"
    );
    if (!insight || !insight.values?.[0]) return 0;
    const val = insight.values[0].value as Record<string, number>;
    if (typeof val === "object") {
      return Object.values(val).reduce((a, b) => a + b, 0);
    }
    return 0;
  };

  return {
    impressions: getValue("insights.post_impressions"),
    reach: getValue("insights.post_impressions_unique"),
    likes: getReactions(),
    comments: 0,
    shares: getValue("insights.post_shares"),
    clicks: getValue("insights.post_clicks"),
  };
}
