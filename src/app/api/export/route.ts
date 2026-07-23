import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

async function getUserWorkspaceId(userId: string) {
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId },
  });
  return membership?.workspaceId ?? null;
}

type ExportBody = {
  type: "pdf" | "csv" | "json";
  scope: "analytics" | "posts" | "campaigns";
  dateRange?: { from: string; to: string };
  brandKitId?: string;
};

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((h) => escapeCsv(String(row[h] ?? ""))).join(",")
    ),
  ];
  return lines.join("\n");
}

export async function POST(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  const workspaceId = await getUserWorkspaceId(session.userId);
  if (!workspaceId) {
    return Response.json({ error: "Aucun workspace trouvé" }, { status: 404 });
  }

  const body = (await request.json()) as ExportBody;
  const { type, scope, dateRange, brandKitId } = body;

  const from = dateRange?.from ? new Date(dateRange.from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const to = dateRange?.to ? new Date(dateRange.to) : new Date();

  type BrandKitData = { colors?: Record<string, string> | null; fonts?: Record<string, string> | null; logoUrl?: string | null };
  let brandKit: BrandKitData | null = null;
  if (brandKitId) {
    brandKit = await prisma.brandKit.findFirst({
      where: { id: brandKitId, workspaceId },
    }) as BrandKitData | null;
  }

  if (scope === "analytics") {
    const analytics = await prisma.postAnalytics.aggregate({
      _sum: { impressions: true, reach: true, likes: true, comments: true, shares: true, clicks: true },
      where: {
        post: { content: { campaign: { workspaceId } } },
        fetchedAt: { gte: from, lte: to },
      },
    });

    const platformBreakdown = await prisma.post.groupBy({
      by: ["platform"],
      _count: { id: true },
      where: {
        content: { campaign: { workspaceId } },
        status: "PUBLISHED",
        publishedAt: { gte: from, lte: to },
      },
    });

    const data = {
      summary: {
        impressions: Number(analytics._sum.impressions ?? 0),
        reach: Number(analytics._sum.reach ?? 0),
        likes: Number(analytics._sum.likes ?? 0),
        comments: Number(analytics._sum.comments ?? 0),
        shares: Number(analytics._sum.shares ?? 0),
        clicks: Number(analytics._sum.clicks ?? 0),
      },
      platformBreakdown: platformBreakdown.map((p) => ({
        platform: p.platform,
        posts: Number(p._count.id),
      })),
      dateRange: { from: from.toISOString(), to: to.toISOString() },
    };

    if (type === "csv") {
      const csv = toCsv([data.summary]);
      return new Response(csv, {
        headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="analytics-export.csv"` },
      });
    }
    if (type === "json") {
      return Response.json(data);
    }
    return Response.json({ error: "PDF via /api/export/pdf" }, { status: 400 });
  }

  if (scope === "posts") {
    const posts = await prisma.post.findMany({
      where: {
        content: { campaign: { workspaceId } },
        createdAt: { gte: from, lte: to },
      },
      include: {
        content: { select: { sourceIdea: true } },
        analytics: { orderBy: { fetchedAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    });

    const rows = posts.map((p) => ({
      id: p.id,
      platform: p.platform,
      status: p.status,
      sourceIdea: p.content.sourceIdea,
      body: p.body.slice(0, 200),
      scheduledAt: p.scheduledAt?.toISOString() ?? "",
      publishedAt: p.publishedAt?.toISOString() ?? "",
      impressions: p.analytics[0]?.impressions ?? 0,
      likes: p.analytics[0]?.likes ?? 0,
      comments: p.analytics[0]?.comments ?? 0,
      shares: p.analytics[0]?.shares ?? 0,
    }));

    if (type === "csv") {
      const csv = toCsv(rows);
      return new Response(csv, {
        headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="posts-export.csv"` },
      });
    }
    return Response.json({ posts: rows, dateRange: { from: from.toISOString(), to: to.toISOString() } });
  }

  if (scope === "campaigns") {
    const campaigns = await prisma.campaign.findMany({
      where: { workspaceId },
      include: {
        contents: {
          include: {
            posts: {
              include: { analytics: { orderBy: { fetchedAt: "desc" }, take: 1 } },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const rows = campaigns.map((c) => {
      const totalPosts = c.contents.reduce((sum, cont) => sum + cont.posts.length, 0);
      const publishedPosts = c.contents.reduce(
        (sum, cont) => sum + cont.posts.filter((p) => p.status === "PUBLISHED").length,
        0
      );
      const totalReach = c.contents.reduce(
        (sum, cont) =>
          sum + cont.posts.reduce((s, p) => s + (p.analytics[0]?.reach ?? 0), 0),
        0
      );
      return {
        id: c.id,
        title: c.title,
        description: c.description ?? "",
        totalPosts,
        publishedPosts,
        totalReach,
        createdAt: c.createdAt.toISOString(),
      };
    });

    if (type === "csv") {
      const csv = toCsv(rows);
      return new Response(csv, {
        headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="campaigns-export.csv"` },
      });
    }
    return Response.json({ campaigns: rows });
  }

  return Response.json({ error: "Scope invalide" }, { status: 400 });
}
