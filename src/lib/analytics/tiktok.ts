import type { PostMetrics } from "./index";

interface TikTokVideo {
  id: string;
  like_count: number;
  comment_count: number;
  share_count: number;
  view_count: number;
}

interface TikTokResponse {
  data: {
    videos: TikTokVideo[];
  };
}

export async function fetchTikTokMetrics(
  accessToken: string,
  platformPostId: string
): Promise<PostMetrics> {
  const url = `https://open.tiktokapis.com/v2/video/video_list/?fields=like_count,comment_count,share_count,view_count&video_ids=${platformPostId}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`TikTok analytics error: ${res.status}`);
  }

  const data: TikTokResponse = await res.json();

  if (!data.data?.videos?.length) {
    return {
      impressions: 0,
      reach: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      clicks: 0,
    };
  }

  const video = data.data.videos[0];

  return {
    impressions: video.view_count,
    reach: video.view_count,
    likes: video.like_count,
    comments: video.comment_count,
    shares: video.share_count,
    clicks: 0,
  };
}
