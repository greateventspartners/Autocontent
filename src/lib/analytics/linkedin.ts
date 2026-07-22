import type { PostMetrics } from "./index";

interface LinkedInShareStats {
  likeCount: number;
  commentCount: number;
  shareCount: number;
  clickCount: number;
}

export async function fetchLinkedInMetrics(
  accessToken: string,
  platformPostId: string
): Promise<PostMetrics> {
  const baseUrl = "https://api.linkedin.com/v2";

  const statsRes = await fetch(
    `${baseUrl}/organizationalEntityShareStatistics?q=organizationalEntity&shares[0]=urn:li:share:${platformPostId}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!statsRes.ok) {
    throw new Error(`LinkedIn stats error: ${statsRes.status}`);
  }

  const statsData: any = await statsRes.json();
  const elements = statsData.elements as LinkedInShareStats[];

  if (!elements || elements.length === 0) {
    return {
      impressions: 0,
      reach: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      clicks: 0,
    };
  }

  const stats = elements[0];

  const summaryRes = await fetch(
    `${baseUrl}/socialActions/urn:li:share:${platformPostId}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  let totalLikes = stats.likeCount;
  let totalComments = stats.commentCount;

  if (summaryRes.ok) {
    const summaryData: any = await summaryRes.json();
    if (summaryData.likesSummary) {
      totalLikes = summaryData.likesSummary.totalLikes;
    }
    if (summaryData.commentsSummary) {
      totalComments = summaryData.commentsSummary.totalFirstLevelComments;
    }
  }

  return {
    impressions: 0,
    reach: 0,
    likes: totalLikes,
    comments: totalComments,
    shares: stats.shareCount,
    clicks: stats.clickCount,
  };
}
