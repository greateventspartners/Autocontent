import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { generateRepurpose } from "@/lib/gemini";

const PLATFORM_SPECS: Record<string, string> = {
  twitter: "Tweet (280 caractères max). Impactant, concis, hashtags pertinents.",
  linkedin: "Post LinkedIn (1500 caractères max). Professionnel, storytelling, 3-5 paragraphs, emojis modérés.",
  instagram: "Caption Instagram (2200 caractés max). Accrocheur, emojis, hashtags en fin de post.",
  threads: "Post Threads (500 caractères max). Conversationnel, direct, sans hashtags.",
  tiktok_script: "Script TikTok (60 secondes max). Hook fort, ton décontracté, CTA à la fin.",
  youtube_short: "Script YouTube Short (60 secondes max). Hook visuel, rythme rapide, CTA.",
  blog: "Article de blog (800-1500 mots). Intro accrocheuse, sous-titres H2/H3, conclusion avec CTA.",
  newsletter: "Email newsletter (400-600 mots). Personnalisé, storytelling, CTA clair.",
};

async function getUserWorkspaceId(userId: string) {
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId },
  });
  return membership?.workspaceId ?? null;
}

export async function GET() {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const workspaceId = await getUserWorkspaceId(session.userId);
  if (!workspaceId) return NextResponse.json({ error: "Workspace introuvable" }, { status: 404 });

  const jobs = await prisma.repurposeJob.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json(jobs);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const workspaceId = await getUserWorkspaceId(session.userId);
  if (!workspaceId) return NextResponse.json({ error: "Workspace introuvable" }, { status: 404 });

  const { sourceText, sourceTitle, platforms } = await request.json() as {
    sourceText?: string;
    sourceTitle?: string;
    platforms?: string[];
  };

  if (!sourceText || !platforms?.length) {
    return NextResponse.json({ error: "Text source et plateformes requis" }, { status: 400 });
  }

  const job = await prisma.repurposeJob.create({
    data: {
      workspaceId,
      sourceText,
      sourceTitle: sourceTitle ?? null,
      targetPlatforms: platforms.join(","),
      status: "processing",
    },
  });

  const specs = platforms
    .map((p) => `[${p}] ${PLATFORM_SPECS[p] ?? "Post court et percutant."}`)
    .join("\n");

  const prompt = `Tu es un expert en création de contenu social media. Tu dois transformer le texte source ci-dessous en ${platforms.length} variantes adaptées à chaque plateforme.

Pour chaque plateforme, génère :
1. Le contenu adapté au format et au ton de la plateforme
2. Un titre court
3. Des hashtags pertinents

Texte source :
"${sourceText}"

Consignes par plateforme :
${specs}

Réponds en JSON valide avec cette structure :
{
  "variants": [
    {
      "platform": "nom_de_la_plateforme",
      "title": "titre court",
      "content": "contenu adapté",
      "hashtags": ["tag1", "tag2"]
    }
  ]
}`;

  try {
    const result = await generateRepurpose(prompt);
    const parsed = JSON.parse(result);

    const updated = await prisma.repurposeJob.update({
      where: { id: job.id },
      data: {
        results: parsed.variants,
        status: "completed",
      },
    });

    return NextResponse.json(updated);
  } catch {
    await prisma.repurposeJob.update({
      where: { id: job.id },
      data: { status: "failed" },
    });
    return NextResponse.json({ error: "Erreur lors de la transformation" }, { status: 500 });
  }
}
