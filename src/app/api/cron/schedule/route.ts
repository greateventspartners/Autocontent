import { prisma } from "@/lib/prisma";
import { publishPost } from "@/lib/publishers";

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

  return Response.json({
    timestamp: now.toISOString(),
    processed: results.length,
    results,
  });
}
