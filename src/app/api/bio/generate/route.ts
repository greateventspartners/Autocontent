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
    name: kit.name,
  };
}

export const BIO_PLATFORMS = [
  { id: "linkedin", label: "LinkedIn", instruction: "Bio LinkedIn professionnelle, 1-2 phrases, 1re personne, crédibilité B2B." },
  { id: "twitter", label: "X (Twitter)", instruction: "Bio X percutante, max 160 caractères, ton affirmé." },
  { id: "instagram", label: "Instagram", instruction: "Bio Instagram inspirante, 1-2 phrases + 3 hashtags, emojis choisis." },
  { id: "facebook", label: "Facebook", instruction: "Bio Facebook conversationnelle, chaleureuse, qui donne envie de suivre." },
  { id: "tiktok", label: "TikTok", instruction: "Bio TikTok courte, dynamique, 1 emoji, accrocheur." },
  { id: "pinterest", label: "Pinterest", instruction: "Bio Pinterest descriptive et optimisée SEO." },
  { id: "wordpress", label: "WordPress", instruction: "Bio d'auteur WordPress, 1 paragraphe, ton éditorial." },
  { id: "medium", label: "Medium", instruction: "Bio Medium éditoriale, point de vue unique." },
];

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  const workspaceId = await getUserWorkspaceId(session.userId);
  if (!workspaceId) {
    return Response.json({ error: "Aucun workspace trouvé" }, { status: 404 });
  }

  let requested = BIO_PLATFORMS;
  try {
    const body = await request.json() as { platforms?: string[] };
    if (body.platforms?.length) {
      const set = new Set(body.platforms);
      requested = BIO_PLATFORMS.filter((p) => set.has(p.id));
    }
  } catch {
    /* utilise toutes les plateformes par défaut */
  }

  const brandKit = await getBrandKit(workspaceId);
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "GEMINI_API_KEY manquante" }, { status: 500 });
  }

  let system =
    "Tu es un expert en personal branding. Tu génères des bios de profil cohérentes avec l'identité de marque du client, en proposant 2 variations par plateforme.";
  if (brandKit?.name) system += `\nNom de la marque: ${brandKit.name}`;
  if (brandKit?.toneOfVoice) system += `\nTon de voix: ${brandKit.toneOfVoice}`;
  if (brandKit?.doAndDonts) system += `\nContraintes: ${brandKit.doAndDonts}`;
  if (brandKit?.keywords) system += `\nMots-clés à intégrer naturellement: ${brandKit.keywords}`;

  const platformBlock = requested.map((p) => `- ${p.id}: ${p.instruction}`).join("\n");
  const prompt = `Génère 2 variations de bio pour chaque plateforme.
Réponds en JSON strict: { "bios": { "plateforme": ["variation 1", "variation 2"] } }.
Plateformes:
${platformBlock}`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: system,
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    });

    const text = result.response.text();
    const parsed = JSON.parse(text) as { bios?: Record<string, string[]> };
    return Response.json({ bios: parsed.bios ?? {} });
  } catch {
    return Response.json({ error: "Génération de bios impossible" }, { status: 500 });
  }
}
