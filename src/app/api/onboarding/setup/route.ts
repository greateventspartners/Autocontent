import { GoogleGenerativeAI } from "@google/generative-ai";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { BIO_PLATFORMS } from "@/lib/bio-platforms";

async function getUserWorkspaceId(userId: string) {
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId },
  });
  return membership?.workspaceId ?? null;
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

  try {
    const body = (await request.json()) as {
      name?: string;
      logoUrl?: string;
      colors?: { hex: string; name: string }[];
      toneOfVoice?: string;
      doAndDonts?: string;
      keywords?: string;
      voiceSamples?: string[];
    };

    const brandKit = await prisma.brandKit.create({
      data: {
        workspaceId,
        name: body.name || "Brand Kit",
        logoUrl: body.logoUrl || null,
        colors: body.colors
          ? (body.colors as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        fonts: body.keywords
          ? ({ keywords: body.keywords } as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        toneOfVoice: body.toneOfVoice || null,
        doAndDonts: body.doAndDonts || null,
        voiceSamples: body.voiceSamples?.length
          ? (body.voiceSamples as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
    });

    let bios: Record<string, string[]> = {};
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        let system =
          "Tu es un expert en personal branding. Tu génères des bios de profil cohérentes avec l'identité de marque du client, en proposant 2 variations par plateforme.";
        if (body.name) system += `\nNom de la marque: ${body.name}`;
        if (body.toneOfVoice)
          system += `\nTon de voix: ${body.toneOfVoice}`;
        if (body.doAndDonts)
          system += `\nContraintes: ${body.doAndDonts}`;
        if (body.keywords)
          system += `\nMots-clés à intégrer naturellement: ${body.keywords}`;

        const platformBlock = BIO_PLATFORMS.map(
          (p) => `- ${p.id}: ${p.instruction}`
        ).join("\n");
        const prompt = `Génère 2 variations de bio pour chaque plateforme.
Réponds en JSON strict: { "bios": { "plateforme": ["variation 1", "variation 2"] } }.
Plateformes:
${platformBlock}`;

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
        bios = parsed.bios ?? {};
      } catch {
        /* La génération de bios n'est pas bloquante */
      }
    }

    await prisma.brandKit.update({
      where: { id: brandKit.id },
      data: { bios: bios as Prisma.InputJsonValue },
    });

    await prisma.workspace.update({
      where: { id: workspaceId },
      data: { onboardingCompleted: true },
    });

    const res = Response.json({ ok: true });
    res.headers.append(
      "Set-Cookie",
      "onboarding_done=1; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000"
    );
    return res;
  } catch (error) {
    console.error("Onboarding setup error:", error);
    return Response.json(
      { error: "Erreur lors de la configuration" },
      { status: 500 }
    );
  }
}
