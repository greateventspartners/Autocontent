import { NextResponse } from "next/server";
import { generateWithFallback } from "@/lib/gemini";

type HashtagItem = {
  tag: string;
  popularity: "high" | "medium" | "low";
  relevance: "high" | "medium" | "low";
  category: "trending" | "niche" | "branded";
};

export async function POST(request: Request) {
  const { topic, platform, niche } = (await request.json()) as {
    topic?: string;
    platform?: string;
    niche?: string;
  };

  if (!topic || !platform) {
    return NextResponse.json(
      { error: "topic et platform requis" },
      { status: 400 },
    );
  }

  const nicheLine = niche ? `\nNiche spécifique: ${niche}` : "";

  const prompt = `Tu es un expert en social media marketing et SEO. Génère une liste de 30 hashtags pertinents pour le sujet: "${topic}" sur la plateforme ${platform}.${nicheLine}

Pour chaque hashtag, fournis:
1. Le tag (sans le #)
2. La popularité: "high", "medium" ou "low"
3. La pertinence: "high", "medium" ou "low"
4. La catégorie: "trending", "niche" ou "branded"

Réponds en JSON valide avec cette structure exacte:
{
  "hashtags": [
    {
      "tag": "exhashtag",
      "popularity": "high",
      "relevance": "high",
      "category": "trending"
    }
  ]
}`;

  try {
    const { text } = await generateWithFallback(
      {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      },
      "Tu es un expert en création de hashtags pour les réseaux sociaux. Tu retournes uniquement du JSON valide sans texte supplémentaire.",
      {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    );

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Réponse invalide de l'IA" },
        { status: 500 },
      );
    }

    const parsed = JSON.parse(jsonMatch[0]) as { hashtags?: unknown };

    if (!Array.isArray(parsed.hashtags)) {
      return NextResponse.json(
        { error: "Format de réponse inattendu" },
        { status: 500 },
      );
    }

    const hashtags: HashtagItem[] = parsed.hashtags.map(
      (h: Record<string, string>): HashtagItem => ({
        tag: h.tag?.replace(/^#/, "") ?? "",
        popularity: (["high", "medium", "low"].includes(h.popularity)
          ? h.popularity
          : "medium") as HashtagItem["popularity"],
        relevance: (["high", "medium", "low"].includes(h.relevance)
          ? h.relevance
          : "medium") as HashtagItem["relevance"],
        category: (["trending", "niche", "branded"].includes(h.category)
          ? h.category
          : "niche") as HashtagItem["category"],
      }),
    );

    return NextResponse.json({ hashtags });
  } catch (err) {
    console.error("[Hashtags] Gemini error:", err);
    return NextResponse.json(
      { error: "Erreur lors de la génération des hashtags" },
      { status: 500 },
    );
  }
}
