import { generateWithFallback } from "@/lib/gemini";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BIO_PLATFORMS } from "@/lib/bio-platforms";

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

export async function POST(request: Request) {
  const session = await getSession(request);
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
    const { text } = await generateWithFallback(
      { contents: [{ role: "user", parts: [{ text: prompt }] }] },
      system,
      { responseMimeType: "application/json" },
    );
    if (!text || !text.trim()) {
      return Response.json({ bios: {} });
    }
    const parsed = JSON.parse(text) as { bios?: Record<string, string[]> };
    return Response.json({ bios: parsed.bios ?? {} });
  } catch {
    return Response.json({ bios: {} });
  }
}
