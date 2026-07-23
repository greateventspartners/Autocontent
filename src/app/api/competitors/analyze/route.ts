import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { generateWithFallback } from "@/lib/gemini";
import type { GenerateContentRequest } from "@google/generative-ai";

async function getUserWorkspaceId(userId: string) {
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId },
  });
  return membership?.workspaceId ?? null;
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

  const { competitorId } = (await request.json()) as { competitorId?: string };

  if (!competitorId) {
    return Response.json(
      { error: "competitorId est requis" },
      { status: 400 },
    );
  }

  const competitor = await prisma.competitor.findFirst({
    where: { id: competitorId, workspaceId },
  });

  if (!competitor) {
    return Response.json(
      { error: "Concurrent non trouvé" },
      { status: 404 },
    );
  }

  const contextParts = [
    `Nom: ${competitor.name}`,
    `Plateforme: ${competitor.platform}`,
  ];
  if (competitor.profileUrl) contextParts.push(`Profil: ${competitor.profileUrl}`);
  if (competitor.bio) contextParts.push(`Bio: ${competitor.bio}`);
  if (competitor.followers) contextParts.push(`Abonnés: ${competitor.followers}`);
  if (competitor.postFrequency) contextParts.push(`Fréquence de publication: ${competitor.postFrequency}`);
  if (competitor.avgEngagement) contextParts.push(`Engagement moyen: ${competitor.avgEngagement}`);

  const prompt = `Analyse ce concurrent sur les réseaux sociaux et fournis un rapport structuré en JSON.

Informations sur le concurrent:
${contextParts.join("\n")}

Réponds UNIQUEMENT avec un JSON valide (pas de texte avant ou après) avec cette structure exacte:
{
  "bioAnalysis": "Analyse de la bio et du positionnement",
  "postFrequency": "Fréquence de publication estimée",
  "contentThemes": ["thème 1", "thème 2", "thème 3", "thème 4"],
  "engagementPatterns": "Patterns d'engagement observés",
  "strengths": ["point fort 1", "point fort 2", "point fort 3"],
  "weaknesses": ["point faible 1", "point faible 2", "point faible 3"],
  "topContent": ["type de contenu performant 1", "type de contenu performant 2"],
  "avgEngagement": "Niveau d'engagement estimé"
}`;

  const systemInstruction = `Tu es un expert en analyse de concurrents sur les réseaux sociaux. Tu analyses les profils publics et fournis des insights actionnables. Réponds toujours en français avec un JSON strict.`;

  try {
    const request_: GenerateContentRequest = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    };

    const { text } = await generateWithFallback(request_, systemInstruction, {
      temperature: 0.3,
      maxOutputTokens: 2048,
    });

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return Response.json(
        { error: "Réponse IA invalide" },
        { status: 500 },
      );
    }

    const analysis = JSON.parse(jsonMatch[0]) as {
      bioAnalysis?: string;
      postFrequency?: string;
      contentThemes?: string[];
      engagementPatterns?: string;
      strengths?: string[];
      weaknesses?: string[];
      topContent?: string[];
      avgEngagement?: string;
    };

    const updated = await prisma.competitor.update({
      where: { id: competitorId },
      data: {
        bio: analysis.bioAnalysis || competitor.bio,
        postFrequency: analysis.postFrequency || competitor.postFrequency,
        avgEngagement: analysis.avgEngagement || competitor.avgEngagement,
        topContent: (analysis.topContent || competitor.topContent) as any,
        lastAnalyzed: new Date(),
      },
    });

    return Response.json({ competitor: updated, analysis });
  } catch (err: unknown) {
    console.error("[Competitor Analysis]", err);
    return Response.json(
      { error: "Erreur lors de l'analyse IA" },
      { status: 500 },
    );
  }
}
