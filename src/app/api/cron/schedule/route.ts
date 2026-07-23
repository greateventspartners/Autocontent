import { prisma } from "@/lib/prisma";
import { publishPost } from "@/lib/publishers";
import { fetchMetrics, SUPPORTED_ANALYTICS_PLATFORMS } from "@/lib/analytics";
import { generateInsights } from "@/lib/analytics/insights";
import type { Prisma } from "@/generated/prisma/client";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Non autorisé" }, { status: 401 });
  }

  const now = new Date();

  const posts = await prisma.post.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: { lte: now },
    },
    include: {
      content: {
        include: {
          campaign: { select: { workspaceId: true } },
        },
      },
    },
  });

  const results: { postId: string; platform: string; ok: boolean; error?: string }[] = [];

  for (const post of posts) {
    try {
      const connection = await prisma.platformConnection.findUnique({
        where: {
          workspaceId_platform: {
            workspaceId: post.content.campaign.workspaceId,
            platform: post.platform,
          },
        },
      });

      const result = await publishPost({
        platform: post.platform.toLowerCase(),
        body: post.body,
        connection: connection
          ? {
              accessToken: connection.accessToken,
              platformUserId: connection.platformUserId,
            }
          : null,
      });

      if (result.ok) {
        await prisma.post.update({
          where: { id: post.id },
          data: {
            status: "PUBLISHED",
            platformPostId: result.platformPostId ?? null,
            publishedAt: now,
          },
        });
        await prisma.content.update({
          where: { id: post.contentId },
          data: { status: "PUBLISHED" },
        });

        if (
          result.platformPostId &&
          SUPPORTED_ANALYTICS_PLATFORMS.includes(post.platform as any)
        ) {
          const connection = await prisma.platformConnection.findUnique({
            where: {
              workspaceId_platform: {
                workspaceId: post.content.campaign.workspaceId,
                platform: post.platform,
              },
            },
          });
          if (connection) {
            try {
              const metrics = await fetchMetrics(
                post.platform,
                connection.accessToken,
                result.platformPostId
              );
              if (metrics) {
                await prisma.postAnalytics.create({
                  data: {
                    postId: post.id,
                    impressions: metrics.impressions,
                    reach: metrics.reach,
                    likes: metrics.likes,
                    comments: metrics.comments,
                    shares: metrics.shares,
                    clicks: metrics.clicks,
                  },
                });
              }
            } catch {
              // analytics fetch failure is non-blocking
            }
          }
        }
      } else {
        await prisma.post.update({
          where: { id: post.id },
          data: { status: "FAILED" },
        });
        await prisma.content.update({
          where: { id: post.contentId },
          data: { status: "FAILED" },
        });
      }

      results.push({
        postId: post.id,
        platform: post.platform,
        ok: result.ok,
        error: result.ok ? undefined : result.error,
      });
    } catch (error) {
      await prisma.post.update({
        where: { id: post.id },
        data: { status: "FAILED" },
      });

      results.push({
        postId: post.id,
        platform: post.platform,
        ok: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }

  if (results.length > 0) {
    const workspaceIds = [...new Set(posts.map((p) => p.content.campaign.workspaceId))];
    for (const wsId of workspaceIds) {
      try {
        const insights = await generateInsights(wsId);
        if (insights.length > 0) {
          await prisma.contentInsight.deleteMany({ where: { workspaceId: wsId } });
          await prisma.contentInsight.createMany({
            data: insights.map((i) => ({
              workspaceId: wsId,
              type: i.type,
              platform: i.platform,
              title: i.title,
              description: i.description,
              data: i.data as Prisma.InputJsonValue,
            })),
          });
        }
      } catch {
        // insights generation failure is non-blocking
      }
    }
  }

  return Response.json({
    timestamp: now.toISOString(),
    processed: results.length,
    results,
  });
}
