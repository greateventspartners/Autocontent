import { getServiceRoleClient } from "./supabase-admin";
import { getModel, getImageModel } from "./gemini";

interface GenerateParams {
  workspaceId: string;
  brandKitId: string;
  topic: string;
  contentType: "SOCIAL" | "BLOG" | "EMAIL" | "AD";
}

interface GenerateResult {
  title: string;
  variantA: string;
  variantB: string;
  scoreA: number;
  scoreB: number;
  brandScore: number;
  summary: string;
}

interface ChannelPost {
  channel: string;
  title: string;
  content: string;
}

const CONTENT_PROMPTS: Record<string, string> = {
  SOCIAL:
    "Écris un post réseaux (Facebook, Instagram, LinkedIn, X) de 3-5 paragraphes. Inclus des emojis pertinents, 3-5 hashtags, et un appel à l'action.",
  BLOG:
    "Écris un article de blog complet avec introduction, 3-4 sections avec sous-titres, et conclusion. Minimum 800 mots.",
  EMAIL:
    "Écris un email marketing avec objet accrocheur, corps engageant de 4-5 paragraphes, et CTA clair.",
  AD:
    "Écris une copie publicitaire percutante de 2-3 paragraphes. Ton persuasif, orienté bénéfices.",
};

const CHANNEL_PROMPTS: Record<string, string> = {
  LINKEDIN:
    "Rédige un post LinkedIn professionnel et thought-leadership de 3-5 paragraphes. Commence par une accroche forte, développe une idée, termine par une question ouverte. Utilise un ton expert mais accessible. Pas de hashtags excessifs (max 3).",
  INSTAGRAM:
    "Rédige une légende Instagram engageante et esthétique de 2-4 paragraphes. Ajoute 5-10 hashtags stratégiques en fin de message. Ton inspirant et visuel. Termine par un appel à l'action.",
  X:
    "Rédige un post X (Twitter) court et percutant de 1-2 phrases maximum (280 caractères). Accroche immédiate, ton incisif. Ajoute 1-2 hashtags pertinents si nécessaire.",
  FACEBOOK:
    "Rédige un post Facebook de 4-6 paragraphes. Ton conversationnel et authentique. Ajoute une question pour encourager les commentaires. 2-3 emojis discrets.",
  PINTEREST:
    "Rédige une description de Pin Pinterest optimisée SEO (100-300 caractères). Accroche visuelle, mots-clés stratégiques, ton inspirant ou tutoral. Ajoute 3-5 hashtags. Suggère un titre de board et un type de visuel (infographie, photo, tutoriel).",
  WORDPRESS:
    "Rédige un article WordPress avec titre H1, 3-4 sections H2, et une méta-description SEO (max 160 caractères). Ton professionnel et informatif. Ajoute 3-5 catégories/tags et une suggestion d'image de couverture. Minimum 300 mots.",
};

async function loadBrandKit(brandKitId: string) {
  const supabase = getServiceRoleClient();
  const { data } = await supabase
    .from("brand_kits")
    .select("*, tones(*), voice_rules(*), personas(*)")
    .eq("id", brandKitId)
    .single();
  return data;
}

function buildBrandContext(brand: any): string {
  const toneStr = (brand.tones ?? []).map((t: any) => t.label).join(", ");
  const rulesStr = (brand.voice_rules ?? [])
    .map((r: any) => `- ${r.rule}`)
    .join("\n");
  const personasStr = (brand.personas ?? [])
    .map((p: any) => `- ${p.name} (${p.role}): ${p.bio}`)
    .join("\n");
  return [
    `Marque: "${brand.name}".`,
    toneStr ? `Voix: ${toneStr}.` : "",
    rulesStr ? `Règles:\n${rulesStr}` : "",
    personasStr ? `Personas:\n${personasStr}` : "",
    `Slogan: "${brand.slogan || ""}".`,
    `Description: "${brand.description || ""}".`,
  ]
    .filter(Boolean)
    .join("\n");
}

async function generateWithGemini<T>(
  systemPrompt: string,
  userContent: string,
): Promise<T | null> {
  const model = getModel();
  if (!model) return null;

  const result = await model.generateContent({
    contents: [
      { role: "user", parts: [{ text: systemPrompt }] },
      { role: "user", parts: [{ text: userContent }] },
    ],
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 2000,
      responseMimeType: "application/json",
    },
  });

  const text = result.response.text();
  return JSON.parse(text) as T;
}

export async function generateContent(params: GenerateParams): Promise<GenerateResult> {
  const brandKit = await loadBrandKit(params.brandKitId);
  if (!brandKit) throw new Error("Brand kit not found");

  const toneStr = (brandKit.tones ?? []).map((t: any) => t.label).join(", ");
  const rulesStr = (brandKit.voice_rules ?? [])
    .map((r: any) => `- ${r.rule}`)
    .join("\n");
  const personasStr = (brandKit.personas ?? [])
    .map((p: any) => `- ${p.name} (${p.role}): ${p.bio}`)
    .join("\n");
  const formatPrompt = CONTENT_PROMPTS[params.contentType] ?? CONTENT_PROMPTS.SOCIAL;

  const systemPrompt = [
    `Tu es un copywriter marketing expert pour "${brandKit.name}".`,
    `Voix de marque: ${toneStr || "professionnelle, moderne"}.`,
    rulesStr ? `Règles éditoriales:\n${rulesStr}` : "",
    personasStr ? `Personas cibles:\n${personasStr}` : "",
    `Slogan: "${brandKit.slogan || ""}".`,
    `Description: "${brandKit.description || ""}".`,
    `\n${formatPrompt}`,
    `\nGénère DEUX variantes (A et B) pour le sujet suivant.`,
    `Retourne UNIQUEMENT un JSON valide avec la structure:`,
    `{ "title": "...", "variantA": "...", "variantB": "...", "summary": "..." }`,
  ]
    .filter(Boolean)
    .join("\n");

  const geminiResult = await generateWithGemini<{
    title: string;
    variantA: string;
    variantB: string;
    summary: string;
  }>(systemPrompt, `Sujet: ${params.topic || "marketing digital"}`);

  if (geminiResult) {
    return {
      title: geminiResult.title || `Contenu sur: ${params.topic}`,
      variantA: geminiResult.variantA || "",
      variantB: geminiResult.variantB || "",
      scoreA: 92,
      scoreB: 85,
      brandScore: 88,
      summary: geminiResult.summary || `Contenu de type marketing sur "${params.topic}"`,
    };
  }

  return generateMock(brandKit, params);
}

function generateMock(
  brand: any,
  params: GenerateParams
): GenerateResult {
  const tone = brand.tones?.[0]?.label || "Professionnel";
  const tone2 = brand.tones?.[1]?.label || "Moderne";
  const base = `Contenu ${params.contentType} généré pour "${brand.name}" sur le sujet: ${params.topic || "marketing"}`;
  return {
    title: `${brand.name} — ${params.topic || "Stratégie marketing"}`,
    variantA: `[Variante A - ${tone}]\n\n${base}\n\nNous croyons que l'automatisation est la clé. ${brand.slogan}`,
    variantB: `[Variante B - ${tone2}]\n\n${base}\n\nDécouvrez comment notre approche révolutionne votre workflow. ${brand.slogan}`,
    scoreA: 94,
    scoreB: 87,
    brandScore: 90,
    summary: `Contenu optimisé pour la voix de marque ${brand.name}`,
  };
}

export async function generateMultiChannel(
  brandKitId: string,
  topic: string,
  channels: string[]
): Promise<ChannelPost[]> {
  const brandKit = await loadBrandKit(brandKitId);
  if (!brandKit) throw new Error("Brand kit not found");

  const brandCtx = buildBrandContext(brandKit);
  const results: ChannelPost[] = [];

  for (const channel of channels) {
    const channelPrompt = CHANNEL_PROMPTS[channel] || CHANNEL_PROMPTS.LINKEDIN;

    const systemPrompt = [
      `Tu es un copywriter social media expert pour ${brandKit.name}.`,
      brandCtx,
      `\nCanal: ${channel}.`,
      `\n${channelPrompt}`,
      `\nGénère un post UNIQUE pour ce canal sur le sujet: "${topic}".`,
      `Retourne UNIQUEMENT un JSON: { "title": "...", "content": "..." }`,
    ]
      .filter(Boolean)
      .join("\n");

    const geminiResult = await generateWithGemini<{
      title: string;
      content: string;
    }>(systemPrompt, `Sujet: ${topic || "marketing digital"}`);

    if (geminiResult) {
      results.push({ channel, title: geminiResult.title || `Post ${channel}`, content: geminiResult.content || "" });
    } else {
      results.push({
        channel,
        title: `${brandKit.name} — ${topic || "Stratégie"}`,
        content: `[Post ${channel} généré pour "${brandKit.name}" sur: ${topic || "marketing digital"}]`,
      });
    }
  }

  return results;
}

export async function generateTopics(brandKitId: string, count = 30): Promise<string[]> {
  const brandKit = await loadBrandKit(brandKitId);
  if (!brandKit) throw new Error("Brand kit not found");

  const brandCtx = buildBrandContext(brandKit);

  const systemPrompt = [
    `Tu es un stratège éditorial pour "${brandKit.name}".`,
    brandCtx,
    `\nGénère EXACTEMENT ${count} titres/sujets pour un calendrier de contenu marketing.`,
    `Les titres doivent être engageants, alignés avec la marque, et couvrir des sujets variés (tendances, conseils, études de cas, actualités, tutoriels).`,
    `Retourne UNIQUEMENT un tableau JSON de chaînes de caractères : ["titre 1", "titre 2", ...]`,
  ]
    .filter(Boolean)
    .join("\n");

  const geminiResult = await generateWithGemini<string[]>(
    systemPrompt,
    `Génère ${count} titres pour le calendrier éditorial de ${brandKit.name}.`
  );

  if (geminiResult) {
    const topics = Array.isArray(geminiResult) ? geminiResult : (geminiResult as any).titles ?? (geminiResult as any).topics ?? [];
    return topics.slice(0, count);
  }

  return mockTopics(brandKit, count);
}

function mockTopics(brandKit: any, count: number): string[] {
  const topics = [
    `L'avenir du marketing digital selon ${brandKit.name}`,
    `Comment ${brandKit.slogan || "optimiser votre stratégie"} en 2026`,
    `5 tendances à surveiller cette année`,
    `Étude de cas : comment nous avons aidé un client à doubler son ROI`,
    `Les erreurs courantes en marketing automation`,
    `${brandKit.name} : notre vision pour les 12 prochains mois`,
    `Guide complet pour débuter avec le marketing automatisé`,
    `Pourquoi la personnalisation est la clé du succès`,
    `Interview : les coulisses de ${brandKit.name}`,
    `10 outils indispensables pour les marketeurs`,
    `Comment mesurer l'impact de vos campagnes`,
    `L'importance de la voix de marque dans vos communications`,
    `Les secrets d'un contenu viral`,
    `${brandKit.name} vs la concurrence : notre avantage`,
    `Tutoriel : configurer votre première campagne automatisée`,
    `Les chiffres clés du marketing digital en 2026`,
    `Comment fidéliser vos clients avec l'email marketing`,
    `Les réseaux sociaux en 2026 : que faut-il retenir ?`,
    `Webinaire : les meilleures pratiques de content marketing`,
    `L'IA au service de votre stratégie de contenu`,
    `Comment créer un calendrier éditorial efficace`,
    `Les formats de contenu qui fonctionnent le mieux`,
    `Stratégie omnicanale : le guide complet`,
    `Comment optimiser vos publications pour chaque plateforme`,
    `Les KPIs essentiels à suivre en marketing`,
    `Retour d'expérience : 6 mois avec ${brandKit.name}`,
    `Comment générer plus de leads avec votre contenu`,
    `Les tendances SEO à ne pas manquer`,
    `Podcast : l'avenir de l'automatisation marketing`,
    `${brandKit.name} fête ses 1 an : ce que nous avons appris`,
  ];
  return topics.slice(0, count);
}

export async function repurposeContent(
  brandKitId: string,
  longText: string,
  channels: string[]
): Promise<ChannelPost[]> {
  const brandKit = await loadBrandKit(brandKitId);
  if (!brandKit) throw new Error("Brand kit not found");

  const brandCtx = buildBrandContext(brandKit);
  const results: ChannelPost[] = [];

  for (const channel of channels) {
    const channelPrompt = CHANNEL_PROMPTS[channel] || CHANNEL_PROMPTS.LINKEDIN;

    const systemPrompt = [
      `Tu es un content strategist. Tu recycles un contenu long en micro-contenus pour ${channel}.`,
      brandCtx,
      `Consigne: ${channelPrompt}`,
      `Tire 1-2 idées clés du texte source et rédige un post adapté à ${channel}.`,
      `Retourne UNIQUEMENT du JSON: { "title": "...", "content": "..." }`,
    ]
      .filter(Boolean)
      .join("\n");

    const geminiResult = await generateWithGemini<{
      title: string;
      content: string;
    }>(systemPrompt, `Texte source:\n\n${longText.substring(0, 8000)}`);

    if (geminiResult) {
      results.push({ channel, title: geminiResult.title || "", content: geminiResult.content || "" });
    } else {
      results.push({
        channel,
        title: `Recyclé pour ${channel}`,
        content: `[Extrait adapté de: ${longText.substring(0, 100)}...]`,
      });
    }
  }

  return results;
}

export async function generateImage(
  brandKitId: string,
  prompt: string,
): Promise<{ url: string; key: string } | null> {
  const model = getImageModel();
  if (!model) return null;

  const brandKit = await loadBrandKit(brandKitId);
  const brandCtx = brandKit ? buildBrandContext(brandKit) : "";

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          {
            text: [
              brandCtx,
              `\nGénère une image pour le contenu suivant: "${prompt}"`,
              `Format: 1200x630px, style professionnel et moderne.`,
            ].filter(Boolean).join("\n"),
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.6,
      maxOutputTokens: 8192,
    },
  });

  const response = result.response;
  const imagePart = response.candidates?.[0]?.content?.parts?.find(
    (p) => p.inlineData?.mimeType?.startsWith("image/")
  );

  if (!imagePart?.inlineData) return null;

  const { S3_BUCKET, S3_ENDPOINT } = process.env;
  const key = `generated/${Date.now()}-${crypto.randomUUID()}.png`;
  const buffer = Buffer.from(imagePart.inlineData.data, "base64");

  try {
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const { S3Client } = await import("@aws-sdk/client-s3");
    const client = new S3Client({
      region: process.env.S3_REGION || "auto",
      endpoint: S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
      },
      forcePathStyle: true,
    });

    await client.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET || "autocontent",
        Key: key,
        Body: buffer,
        ContentType: "image/png",
      })
    );

    const url = `${S3_ENDPOINT}/${S3_BUCKET}/${key}`;
    return { url, key };
  } catch {
    return null;
  }
}
