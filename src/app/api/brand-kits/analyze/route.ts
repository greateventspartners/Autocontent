import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/supabase-server";
import { handleApiError } from "@/lib/errors";

const MOCK_EXTRACTIONS: Record<string, Partial<{ name: string; slogan: string; description: string; tone: string[]; voiceRules: string[]; colors: any }>> = {
  "pulseforge.ai": {
    name: "PulseForge",
    slogan: "Your brand. Autopiloted.",
    description:
      "Plateforme SaaS d'automatisation marketing IA qui gère vos contenus de A à Z en respectant fidèlement votre voix de marque.",
    tone: ["Visionnaire", "Premium", "Audacieux", "Efficace"],
    voiceRules: [
      "Inspirer confiance en montrant l'autonomie totale du calendrier éditorial.",
      "Mettre en avant le concept de 'Pilote automatique' sans faire perdre le contrôle à l'utilisateur.",
      "Utiliser un ton énergique et orienté résultats.",
    ],
    colors: { primary: "#8b5cf6", secondary: "#ec4899", background: "#0f172a" },
  },
  "eco-green.fr": {
    name: "EcoGreen Solutions",
    slogan: "Le chauffage écologique et économique pour tous",
    description:
      "Installation certifiée de pompes à chaleur et panneaux solaires pour réduire l'empreinte carbone et les factures d'énergie des particuliers.",
    tone: ["Pédagogique", "Engagé", "Chaleureux", "Fiable"],
    voiceRules: [
      "Mettre en avant l'indépendance énergétique et les économies réelles.",
      "Expliquer les concepts techniques avec simplicité, sans condescendance.",
      "Adopter un discours bienveillant axé sur la transition durable.",
    ],
    colors: { primary: "#10b981", secondary: "#f59e0b", background: "#0f172a" },
  },
  "fitlife.com": {
    name: "FitLife Pro",
    slogan: "Le coaching nutritionnel et sportif personnalisé sur mobile",
    description:
      "Une application mobile combinant un entraîneur virtuel IA et des recettes sur-mesure pour atteindre vos objectifs de poids et de santé durablement.",
    tone: ["Motivant", "Dynamique", "Scientifique", "Complice"],
    voiceRules: [
      "Informer avec des faits scientifiques vulgarisés (études de nutrition).",
      "Garder une énergie débordante avec des appels à l'action percutants.",
      "Célébrer chaque petite victoire de l'utilisateur.",
    ],
    colors: { primary: "#ef4444", secondary: "#f97316", background: "#0f172a" },
  },
};

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return Response.json({ error: "URL is required" }, { status: 400 });
    }

    const domain = url
      .replace(/https?:\/\/(www\.)?/, "")
      .split("/")[0]
      .toLowerCase();

    await new Promise((r) => setTimeout(r, 1500));

    const extracted = MOCK_EXTRACTIONS[domain];

    if (!extracted) {
      const generatedName = domain
        .split(".")[0]
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

      return Response.json({
        name: generatedName,
        website: domain,
        slogan: `La révolution numérique au service de ${generatedName}`,
        description: `Entreprise innovante spécialisée dans l'optimisation des services pour le domaine ${generatedName}.`,
        colors: { primary: "#6366f1", secondary: "#10b981", background: "#0f172a" },
        tone: ["Professionnel", "Inspirant", "Ambitieux"],
        voiceRules: [
          `Garder un ton optimiste sur l'avenir de l'activité ${generatedName}.`,
          "Mettre en avant la rigueur technique et le service client irréprochable.",
        ],
        personas: [
          {
            name: "Client",
            role: "Utilisateur type",
            bio: `Persona généré automatiquement pour ${generatedName}.`,
          },
        ],
      });
    }

    return Response.json({
      name: extracted.name,
      website: domain,
      slogan: extracted.slogan,
      description: extracted.description,
      colors: extracted.colors,
      tone: extracted.tone,
      voiceRules: extracted.voiceRules,
      personas: [{ name: "Client", role: "Utilisateur type", bio: `Persona pour ${extracted.name || domain}.` }],
    });
  } catch (err) {
    return handleApiError(err);
  }
}
