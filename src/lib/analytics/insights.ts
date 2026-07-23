import { prisma } from "@/lib/prisma";

export interface Insight {
  type: string;
  platform: string | null;
  title: string;
  description: string;
  data: Record<string, unknown>;
}

export async function generateInsights(workspaceId: string): Promise<Insight[]> {
  const posts = await prisma.post.findMany({
    where: {
      status: "PUBLISHED",
      content: { campaign: { workspaceId } },
    },
    include: {
      analytics: {
        orderBy: { fetchedAt: "desc" },
        take: 1,
      },
      content: { select: { sourceIdea: true } },
    },
  });

  const postsWithAnalytics = posts.filter((p) => p.analytics.length > 0 && p.publishedAt);

  if (postsWithAnalytics.length < 3) {
    return [];
  }

  const insights: Insight[] = [];

  // 1. Best platform
  const platformStats = new Map<string, { reach: number; engagement: number; count: number }>();
  for (const post of postsWithAnalytics) {
    const analytics = post.analytics[0];
    const platform = post.platform;
    const existing = platformStats.get(platform) || { reach: 0, engagement: 0, count: 0 };
    existing.reach += analytics.reach;
    existing.engagement += analytics.likes + analytics.comments + analytics.shares;
    existing.count += 1;
    platformStats.set(platform, existing);
  }

  let bestPlatform = "";
  let bestEngagementRate = 0;
  for (const [platform, stats] of platformStats) {
    const rate = stats.reach > 0 ? stats.engagement / stats.reach : 0;
    if (rate > bestEngagementRate) {
      bestEngagementRate = rate;
      bestPlatform = platform;
    }
  }

  if (bestPlatform) {
    const stats = platformStats.get(bestPlatform)!;
    insights.push({
      type: "BEST_PLATFORM",
      platform: bestPlatform,
      title: "Meilleure plateforme",
      description: `${bestPlatform} génère le meilleur taux d'engagement (${(bestEngagementRate * 100).toFixed(1)}%) avec ${stats.reach.toLocaleString()} portée cumulée sur ${stats.count} posts.`,
      data: {
        platform: bestPlatform,
        engagementRate: bestEngagementRate,
        totalReach: stats.reach,
        postCount: stats.count,
      },
    });
  }

  // 2. Best posting time
  const hourStats = new Map<number, { engagement: number; count: number }>();
  for (const post of postsWithAnalytics) {
    const hour = post.publishedAt!.getHours();
    const analytics = post.analytics[0];
    const existing = hourStats.get(hour) || { engagement: 0, count: 0 };
    existing.engagement += analytics.likes + analytics.comments + analytics.shares;
    existing.count += 1;
    hourStats.set(hour, existing);
  }

  let bestHour = 0;
  let bestHourEngagement = 0;
  for (const [hour, stats] of hourStats) {
    const avg = stats.engagement / stats.count;
    if (avg > bestHourEngagement) {
      bestHourEngagement = avg;
      bestHour = hour;
    }
  }

  if (bestHour > 0) {
    insights.push({
      type: "BEST_TIME",
      platform: null,
      title: "Meilleur horaire",
      description: `Vos posts publiés à ${bestHour}h obtiennent en moyenne ${Math.round(bestHourEngagement)} interactions. Privilégiez ce créneau.`,
      data: { hour: bestHour, avgEngagement: bestHourEngagement },
    });
  }

  // 3. Best day of week
  const dayNames = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  const dayStats = new Map<number, { engagement: number; count: number }>();
  for (const post of postsWithAnalytics) {
    const day = post.publishedAt!.getDay();
    const analytics = post.analytics[0];
    const existing = dayStats.get(day) || { engagement: 0, count: 0 };
    existing.engagement += analytics.likes + analytics.comments + analytics.shares;
    existing.count += 1;
    dayStats.set(day, existing);
  }

  let bestDay = 0;
  let bestDayEngagement = 0;
  for (const [day, stats] of dayStats) {
    const avg = stats.engagement / stats.count;
    if (avg > bestDayEngagement) {
      bestDayEngagement = avg;
      bestDay = day;
    }
  }

  if (dayStats.size > 1) {
    insights.push({
      type: "BEST_DAY",
      platform: null,
      title: "Meilleur jour",
      description: `Les ${dayNames[bestDay]}s sont vos jours les plus performants avec ${Math.round(bestDayEngagement)} interactions en moyenne.`,
      data: { day: bestDay, dayName: dayNames[bestDay], avgEngagement: bestDayEngagement },
    });
  }

  // 4. Top performing post
  const sortedByEngagement = [...postsWithAnalytics].sort((a, b) => {
    const aEng = a.analytics[0].likes + a.analytics[0].comments + a.analytics[0].shares;
    const bEng = b.analytics[0].likes + b.analytics[0].comments + b.analytics[0].shares;
    return bEng - aEng;
  });

  const topPost = sortedByEngagement[0];
  if (topPost) {
    const analytics = topPost.analytics[0];
    insights.push({
      type: "TOP_POST",
      platform: topPost.platform,
      title: "Post le plus performant",
      description: `"${topPost.content.sourceIdea.slice(0, 60)}" sur ${topPost.platform} — ${analytics.likes} likes, ${analytics.comments} commentaires, ${analytics.shares} partages, portée ${analytics.reach.toLocaleString()}.`,
      data: {
        postId: topPost.id,
        platform: topPost.platform,
        title: topPost.content.sourceIdea,
        likes: analytics.likes,
        comments: analytics.comments,
        shares: analytics.shares,
        reach: analytics.reach,
      },
    });
  }

  // 5. Content length correlation
  const shortPosts = postsWithAnalytics.filter((p) => p.body.length < 200);
  const longPosts = postsWithAnalytics.filter((p) => p.body.length >= 200);

  const avgEngagement = (list: typeof postsWithAnalytics) => {
    if (list.length === 0) return 0;
    const total = list.reduce((sum, p) => {
      const a = p.analytics[0];
      return sum + a.likes + a.comments + a.shares;
    }, 0);
    return total / list.length;
  };

  const shortAvg = avgEngagement(shortPosts);
  const longAvg = avgEngagement(longPosts);

  if (shortPosts.length > 0 && longPosts.length > 0) {
    const betterType = shortAvg > longAvg ? "courts" : "longs";
    const diff = Math.abs(shortAvg - longAvg);
    insights.push({
      type: "CONTENT_LENGTH",
      platform: null,
      title: "Longueur optimale",
      description: `Les posts ${betterType} (${shortAvg > longAvg ? "< 200" : "≥ 200"} caractères) performent ${diff > 0 ? `mieux de ${Math.round(diff)} interactions en moyenne` : "de la même manière"}.`,
      data: {
        shortAvg: Math.round(shortAvg),
        longAvg: Math.round(longAvg),
        shortCount: shortPosts.length,
        longCount: longPosts.length,
        recommendation: betterType,
      },
    });
  }

  return insights;
}

export async function getInsightsForPrompt(workspaceId: string): Promise<string> {
  const insights = await prisma.contentInsight.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  if (insights.length === 0) return "";

  const lines = insights.map((i) => `- ${i.title}: ${i.description}`);
  return `\n\nInsights analytics du workspace (à prendre en compte pour optimiser le contenu):\n${lines.join("\n")}`;
}
