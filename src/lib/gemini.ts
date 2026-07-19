import { GoogleGenerativeAI, type GenerateContentRequest } from "@google/generative-ai";

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "votre-cle-api-gemini") {
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
}

type PlatformConfig = {
  systemInstruction: string;
  maxOutput?: number;
};

const platformConfigs: Record<string, PlatformConfig> = {
  linkedin: {
    systemInstruction: `Tu es un expert en marketing B2B et content strategy. Rédige un post LinkedIn professionnel et engageant.

Format :
- Un paragraphe d'accroche fort (1-2 lignes)
- 3-5 paragraphes concis avec des retours à la ligne
- 3-5 hashtags pertinents en fin de post
- Langue: français
- Longueur: 200-400 caractères
- Ton: expert, humain, avec une pointe de storytelling`,
  },
  twitter: {
    systemInstruction: `Tu es un expert en social media. Rédige un thread Twitter/X percutant.

Format :
- Tweet d'accroche fort (<280 caractères)
- 3-5 tweets de suite formant un thread
- Chaque tweet doit avoir une accroche et un call-to-action
- Langue: français
- Ton: direct, challengeur, avec du rythme`,
  },
  instagram: {
    systemInstruction: `Tu es un community manager expert. Rédige une légende Instagram.

Format :
- Accroche forte sur 1-2 lignes
- Corps du texte engageant (3-5 lignes)
- 8-12 hashtags stratégiques en fin de légende
- Langue: français
- Longueur: 100-200 caractères
- Ton: inspirant, visuel, avec des emojis choisis`,
  },
  facebook: {
    systemInstruction: `Tu es un expert en marketing social. Rédige un post Facebook engageant et conversationnel.

Format :
- Accroche qui provoque la discussion (1-2 lignes)
- 2-4 paragraphes naturels et conversationnels
- Question ou call-to-action en fin de post
- 2-3 hashtags discrets
- Langue: français
- Longueur: 150-350 caractères
- Ton: chaleureux, authentique, qui donne envie de commenter`,
  },
  tiktok: {
    systemInstruction: `Tu es un créateur de contenu TikTok expert. Rédige un script vidéo court et viral.

Format :
- Accroche choc (premières 3 secondes) — 1 ligne
- Corps du script (3-5 lignes avec indications visuelles entre parenthèses)
- Call-to-action final
- 3-5 hashtags tendance
- Langue: français
- Longueur: 50-150 caractères
- Ton: dynamique, punchy, avec du rythme`,
  },
  pinterest: {
    systemInstruction: `Tu es un expert SEO visuel et Pinterest. Rédige une description d'épingle Pinterest optimisée.

Format :
- Titre accrocheur avec mots-clés (1 ligne)
- Description détaillée (3-5 lignes avec mots-clés)
- 5-8 hashtags stratégiques
- Langue: français
- Longueur: 100-300 caractères
- Ton: inspirant, utile, avec des conseils pratiques`,
  },
  wordpress: {
    systemInstruction: `Tu es un rédacteur SEO et blogueur expert. Rédige un article de blog professionnel.

Format :
- Titre H1 accrocheur (1 ligne)
- Introduction qui captive (2-3 lignes)
- 3-5 sections avec sous-titres H2
- Conclusion et call-to-action
- 5-8 mots-clés SEO intégrés naturellement
- Langue: français
- Longueur: 400-800 caractères
- Ton: expert, pédagogique, avec une structure claire`,
  },
  medium: {
    systemInstruction: `Tu es un auteur Medium expérimenté. Rédige un article de pensée ou tutoriel.

Format :
- Titre qui intrigue (1 ligne)
- Sous-titre ou chapeau (1-2 lignes)
- 4-6 paragraphes développant une idée
- Conclusion qui ouvre le débat
- 3-5 tags pertinents
- Langue: français
- Longueur: 300-600 caractères
- Ton: authentique, personnel, avec une perspective unique`,
  },
};

export type ImageInput = {
  data: string;
  mimeType: string;
};

export async function generateContent(
  prompt: string,
  platform: string,
  brandKit?: {
    toneOfVoice?: string | null;
    doAndDonts?: string | null;
    keywords?: string;
    voiceSamples?: string[] | null;
  },
  image?: ImageInput,
) {
  const config = platformConfigs[platform];
  if (!config) {
    throw new Error(`Plateforme non supportée: ${platform}`);
  }

  let systemInstruction = config.systemInstruction;

  if (brandKit?.toneOfVoice) {
    systemInstruction += `\n\nTon de la marque: ${brandKit.toneOfVoice}`;
  }
  if (brandKit?.doAndDonts) {
    systemInstruction += `\n\nInstructions spécifiques de la marque:\n${brandKit.doAndDonts}`;
  }
  if (brandKit?.keywords) {
    systemInstruction += `\n\nMots-clés à intégrer naturellement si pertinents: ${brandKit.keywords}`;
  }
  if (brandKit?.voiceSamples && brandKit.voiceSamples.length > 0) {
    systemInstruction += `\n\nVoici des exemples de textes écrits dans la voix de cette marque. Utilise-les comme référence de style, ton et registre :`;
    brandKit.voiceSamples.forEach((sample, i) => {
      systemInstruction += `\n\n--- Exemple ${i + 1} ---\n${sample}`;
    });
  }

  if (image) {
    systemInstruction += `\n\nUne image a été fournie avec cette demande. Analyse-la et intègre-la dans ta réponse si elle est pertinente. Si l'image contient du texte, des produits, un paysage ou un sujet identifiable, décris-la brièvement et utilise cette information pour enrichir le contenu généré.`;
  }

  const genAI = getGenAI();

  if (!genAI) {
    console.log(`[Gemini fallback] Plateforme: ${platform}`);
    console.log(`[Gemini fallback] Prompt: ${prompt}`);
    if (image) console.log(`[Gemini fallback] Image: ${image.mimeType}`);

    const mockContent = `[Contenu simulé — clé Gemini non configurée]\n\nPlateforme: ${platform}\n\n${prompt.slice(0, 500)}`;
    return {
      content: mockContent,
      platform,
      model: "mock",
    };
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction,
    generationConfig: {
      temperature: 0.8,
      topP: 0.9,
      topK: 40,
      maxOutputTokens: config.maxOutput || 1024,
    },
  });

  const parts: GenerateContentRequest["contents"][0]["parts"] = [
    { text: prompt },
  ];

  if (image) {
    parts.push({
      inlineData: {
        data: image.data,
        mimeType: image.mimeType,
      },
    });
  }

  const request: GenerateContentRequest = {
    contents: [
      {
        role: "user",
        parts,
      },
    ],
  };

  try {
    const result = await model.generateContent(request);
    const response = result.response;
    const text = response.text();

    if (!text) {
      throw new Error("Gemini n'a pas généré de contenu");
    }

    return {
      content: text,
      platform,
      model: "gemini-2.0-flash",
    };
  } catch (err: unknown) {
    console.error(`[Gemini] Erreur API:`, err);
    console.log(`[Gemini fallback] Mode simulation — Plateforme: ${platform}`);
    const mockContent = `[Contenu simulé — Gemini indisponible]\n\nPlateforme: ${platform}\n\n${prompt.slice(0, 500)}`;
    return {
      content: mockContent,
      platform,
      model: "mock",
    };
  }
}
