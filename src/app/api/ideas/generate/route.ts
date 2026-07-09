import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getUserWorkspaceId(userId: string) {
  const membership = await prisma.workspaceMember.findFirst({ where: { userId } });
  return membership?.workspaceId ?? null;
}

async function getBrandKit(workspaceId: string) {
  const kit = await prisma.brandKit.findFirst({ where: { workspaceId } });
  if (!kit) return null;
  return {
    toneOfVoice: kit.toneOfVoice,
    doAndDonts: kit.doAndDonts,
    keywords: kit.fonts ? (kit.fonts as { keywords?: string }).keywords : undefined,
  };
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  const workspaceId = await getUserWorkspaceId(session.userId);
  if (!workspaceId) {
    return Response.json({ error: "Aucun workspace trouvé" }, { status: 404 });
  }

  let count = 6;
  try {
    const body = await request.json() as { count?: number };
    if (body.count && body.count > 0) count = Math.min(body.count, 12);
  } catch {
    /* défaut 6 */
  }

  const brandKit = await getBrandKit(workspaceId);
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "GEMINI_API_KEY manquante" }, { status: 500 });
  }

  let system =
    "Tu es un stratège de contenu social media. Tu proposes des idées de contenus pertinentes, variées et accrocheuses.";
  if (brandKit?.toneOfVoice) system += `\nTon de voix: ${brandKit.toneOfVoice}`;
  if (brandKit?.doAndDonts) system += `\nContraintes: ${brandKit.doAndDonts}`;
  if (brandKit?.keywords) system += `\nMots-clés: ${brandKit.keywords}`;

  const prompt = `Propose ${count} idées de contenus pour les réseaux sociaux.
Réponds en JSON strict: { "ideas": [ { "title": "titre de l'idée", "platform": "linkedin|twitter|instagram|facebook|tiktok|pinterest|wordpress|medium", "angle": "angle éditorial en une phrase", "hook": "accroche courte et percutante" } ] }.`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash", systemInstruction: system });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    });
    const text = result.response.text();
    const parsed = JSON.parse(text) as { ideas?: Array<{ title: string; platform: string; angle: string; hook: string }> };
    return Response.json({ ideas: parsed.ideas ?? [] });
  } catch {
    return Response.json({ error: "Génération d'idées impossible" }, { status: 500 });
  }
}
