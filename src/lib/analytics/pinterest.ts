import type { PostMetrics } from "./index";

interface PinterestAnalytics {
  data: Array<{
    metrics: Record<string, number>;
  }>;
}

export async function fetchPinterestMetrics(
  accessToken: string,
  platformPostId: string
): Promise<PostMetrics> {
  const url = `https://api.pinterest.com/v5/pins/${platformPostId}/analytics?metrics=IMPRESSIONS,SAVE,OUTBOUND_CLICK,LIKE,REPIN,VIDEO_VIEW`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Pinterest analytics error: ${res.status}`);
  }

  const data: PinterestAnalytics = await res.json();

  if (!data.data?.length) {
    return {
      impressions: 0,
      reach: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      clicks: 0,
    };
  }

  const metrics = data.data[0].metrics;

  return {
    impressions: metrics.IMPRESSIONS ?? 0,
    reach: metrics.IMPRESSIONS ?? 0,
    likes: metrics.LIKE ?? 0,
    comments: 0,
    shares: metrics.REPIN ?? metrics.SAVE ?? 0,
    clicks: metrics.OUTBOUND_CLICK ?? 0,
  };
}
