import { fetchLinkedInMetrics } from "./linkedin";
import { fetchFacebookMetrics } from "./facebook";
import { fetchTikTokMetrics } from "./tiktok";
import { fetchPinterestMetrics } from "./pinterest";

export interface PostMetrics {
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
}

export type AnalyticsPlatform =
  | "LINKEDIN"
  | "FACEBOOK"
  | "TIKTOK"
  | "PINTEREST";

const FETCHERS: Record<
  AnalyticsPlatform,
  (accessToken: string, platformPostId: string) => Promise<PostMetrics>
> = {
  LINKEDIN: fetchLinkedInMetrics,
  FACEBOOK: fetchFacebookMetrics,
  TIKTOK: fetchTikTokMetrics,
  PINTEREST: fetchPinterestMetrics,
};

export const SUPPORTED_ANALYTICS_PLATFORMS: AnalyticsPlatform[] = [
  "LINKEDIN",
  "FACEBOOK",
  "TIKTOK",
  "PINTEREST",
];

export async function fetchMetrics(
  platform: string,
  accessToken: string,
  platformPostId: string
): Promise<PostMetrics | null> {
  const fetcher = FETCHERS[platform as AnalyticsPlatform];
  if (!fetcher) return null;

  try {
    return await fetcher(accessToken, platformPostId);
  } catch (err) {
    console.error(`[Analytics] Failed to fetch ${platform} metrics:`, err);
    return null;
  }
}
