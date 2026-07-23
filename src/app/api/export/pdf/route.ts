import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

async function getUserWorkspaceId(userId: string) {
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId },
  });
  return membership?.workspaceId ?? null;
}

type PdfBody = {
  reportType: "weekly" | "monthly" | "campaign";
  campaignId?: string;
  brandKitId?: string;
};

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

function firstOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString("fr-FR");
}

const PLATFORM_NAMES: Record<string, string> = {
  LINKEDIN: "LinkedIn", TWITTER: "X", INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook", TIKTOK: "TikTok", PINTEREST: "Pinterest",
  WORDPRESS: "WordPress", MEDIUM: "Medium",
};

export async function POST(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  const workspaceId = await getUserWorkspaceId(session.userId);
  if (!workspaceId) {
    return Response.json({ error: "Aucun workspace trouvé" }, { status: 404 });
  }

  const body = (await request.json()) as PdfBody;
  const { reportType, campaignId, brandKitId } = body;

  const from = reportType === "weekly" ? daysAgo(7) : reportType === "monthly" ? firstOfMonth() : daysAgo(30);
  const to = new Date();
  const title = reportType === "weekly" ? "Rapport Hebdomadaire" : reportType === "monthly" ? "Rapport Mensuel" : "Rapport Campagne";

  type BrandKitData = { colors?: Record<string, string> | null; fonts?: Record<string, string> | null; logoUrl?: string | null };
  let brandKit: BrandKitData | null = null;
  if (brandKitId) {
    brandKit = await prisma.brandKit.findFirst({
      where: { id: brandKitId, workspaceId },
    }) as BrandKitData | null;
  }

  const campaignWhere = campaignId
    ? { campaign: { id: campaignId, workspaceId } }
    : { campaign: { workspaceId } };

  const postWhere = campaignId
    ? { content: { campaign: { id: campaignId, workspaceId } } }
    : { content: { workspaceId } };

  const [analytics, postsByPlatform, topPostsRaw, insights] = await Promise.all([
    prisma.postAnalytics.aggregate({
      _sum: { impressions: true, reach: true, likes: true, comments: true, shares: true, clicks: true },
      where: {
        post: postWhere,
        fetchedAt: { gte: from, lte: to },
      },
    }),
    prisma.post.groupBy({
      by: ["platform"],
      _count: { id: true },
      where: {
        ...postWhere,
        status: "PUBLISHED",
        publishedAt: { gte: from, lte: to },
      },
    }),
    prisma.postAnalytics.groupBy({
      by: ["postId"],
      _sum: { reach: true, impressions: true, likes: true, comments: true, shares: true },
      _max: { fetchedAt: true },
      where: {
        post: { ...postWhere, status: "PUBLISHED" },
        fetchedAt: { gte: from, lte: to },
      },
      orderBy: { _sum: { reach: "desc" } },
      take: 5,
    }),
    prisma.contentInsight.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const topPosts = await Promise.all(
    topPostsRaw.map(async (row) => {
      const post = await prisma.post.findUnique({
        where: { id: row.postId },
        select: { body: true, platform: true, content: { select: { sourceIdea: true } } },
      });
      if (!post) return null;
      return {
        title: post.content.sourceIdea,
        platform: PLATFORM_NAMES[post.platform] || post.platform,
        reach: Number(row._sum.reach ?? 0),
        likes: Number(row._sum.likes ?? 0),
        comments: Number(row._sum.comments ?? 0),
        shares: Number(row._sum.shares ?? 0),
      };
    })
  );

  const sum = analytics._sum ?? {};
  const totalReach = Number(sum.reach ?? 0);
  const totalImpressions = Number(sum.impressions ?? 0);
  const totalLikes = Number(sum.likes ?? 0);
  const totalComments = Number(sum.comments ?? 0);
  const totalShares = Number(sum.shares ?? 0);
  const totalClicks = Number(sum.clicks ?? 0);
  const engagement = totalReach > 0 ? ((totalLikes + totalComments + totalShares) / totalReach) * 100 : 0;

  const primaryColor = brandKit?.colors?.primary ?? "#6366f1";
  const secondaryColor = brandKit?.colors?.secondary ?? "#8b5cf6";
  const fontFamily = brandKit?.fonts?.heading ?? "Inter, system-ui, sans-serif";
  const logoUrl = brandKit?.logoUrl ?? "";
  const dateRangeStr = `${from.toLocaleDateString("fr-FR")} — ${to.toLocaleDateString("fr-FR")}`;

  const platformRows = postsByPlatform
    .map((p) => `<tr><td>${PLATFORM_NAMES[p.platform] || p.platform}</td><td style="text-align:right">${p._count.id}</td></tr>`)
    .join("");

  const topPostRows = topPosts
    .filter(Boolean)
    .map(
      (p, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${p!.title}</td>
        <td>${p!.platform}</td>
        <td style="text-align:right">${formatNumber(p!.reach)}</td>
        <td style="text-align:right">${formatNumber(p!.likes)}</td>
        <td style="text-align:right">${formatNumber(p!.comments)}</td>
        <td style="text-align:right">${formatNumber(p!.shares)}</td>
      </tr>`
    )
    .join("");

  const insightItems = insights
    .map((ins) => `<li style="margin-bottom:8px"><strong>${ins.title}</strong> — ${ins.description}</li>`)
    .join("");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>${title} — Autocontent</title>
<style>
  @page { margin: 20mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: ${fontFamily}; color: #1e293b; line-height: 1.6; padding: 40px; }
  .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; padding-bottom: 16px; border-bottom: 3px solid ${primaryColor}; }
  .header-left { display: flex; align-items: center; gap: 16px; }
  .logo { width: 48px; height: 48px; border-radius: 12px; background: ${primaryColor}; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: bold; font-size: 18px; }
  .header h1 { font-size: 24px; font-weight: 700; color: ${primaryColor}; }
  .header .date { font-size: 13px; color: #64748b; margin-top: 2px; }
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 24px 0; }
  .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; text-align: center; }
  .kpi-card .value { font-size: 28px; font-weight: 700; color: ${primaryColor}; }
  .kpi-card .label { font-size: 12px; color: #64748b; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
  h2 { font-size: 18px; font-weight: 600; margin: 24px 0 12px; color: #0f172a; border-left: 4px solid ${secondaryColor}; padding-left: 12px; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
  th { background: #f1f5f9; text-align: left; padding: 10px 12px; font-weight: 600; color: #334155; border-bottom: 2px solid ${primaryColor}; }
  td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
  tr:hover td { background: #f8fafc; }
  .insights-list { padding-left: 20px; }
  .insights-list li { font-size: 14px; color: #334155; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 2px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8; }
  .footer strong { color: ${primaryColor}; }
</style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      ${logoUrl ? `<img src="${logoUrl}" alt="Logo" style="width:48px;height:48px;border-radius:12px;object-fit:contain" />` : `<div class="logo">AC</div>`}
      <div>
        <h1>${title}</h1>
        <div class="date">${dateRangeStr}</div>
      </div>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card"><div class="value">${formatNumber(totalReach)}</div><div class="label">Portée</div></div>
    <div class="kpi-card"><div class="value">${formatNumber(totalImpressions)}</div><div class="label">Impressions</div></div>
    <div class="kpi-card"><div class="value">${engagement.toFixed(1)}%</div><div class="label">Engagement</div></div>
    <div class="kpi-card"><div class="value">${formatNumber(totalClicks)}</div><div class="label">Clics</div></div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card"><div class="value">${formatNumber(totalLikes)}</div><div class="label">Likes</div></div>
    <div class="kpi-card"><div class="value">${formatNumber(totalComments)}</div><div class="label">Commentaires</div></div>
    <div class="kpi-card"><div class="value">${formatNumber(totalShares)}</div><div class="label">Partages</div></div>
    <div class="kpi-card"><div class="value">${postsByPlatform.reduce((s, p) => s + p._count.id, 0)}</div><div class="label">Posts publiés</div></div>
  </div>

  <h2>Posts par plateforme</h2>
  <table>
    <thead><tr><th>Plateforme</th><th style="text-align:right">Posts</th></tr></thead>
    <tbody>${platformRows || "<tr><td colspan='2'>Aucune donnée</td></tr>"}</tbody>
  </table>

  <h2>Top posts</h2>
  <table>
    <thead>
      <tr><th>#</th><th>Titre</th><th>Plateforme</th><th style="text-align:right">Portée</th><th style="text-align:right">Likes</th><th style="text-align:right">Comment.</th><th style="text-align:right">Partages</th></tr>
    </thead>
    <tbody>${topPostRows || "<tr><td colspan='7'>Aucune donnée</td></tr>"}</tbody>
  </table>

  <h2>Insights</h2>
  ${insightItems ? `<ul class="insights-list">${insightItems}</ul>` : "<p style='color:#64748b;font-size:14px'>Aucun insight disponible.</p>"}

  <div class="footer">
    <strong>Autocontent</strong> — Rapport généré le ${to.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
