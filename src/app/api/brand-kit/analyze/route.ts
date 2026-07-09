import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { url }: { url?: string } = await request.json();
  if (!url) {
    return Response.json({ error: "URL requise" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "GEMINI_API_KEY manquante" }, { status: 500 });
  }

  let html = "";
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 Autocontent" } });
    html = await res.text();
  } catch {
    return Response.json({ error: "Impossible de récupérer l'URL" }, { status: 502 });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Analyse cette page web et extrais l'identité de marque au format JSON strict :
{
  "colors": [{"hex": "#RRGGBB", "name": "Nom"}],
  "toneOfVoice": "une phrase décrivant le ton",
  "doAndDonts": "instructions do & don't",
  "keywords": "mots-clés séparés par des virgules"
}
Utilise les couleurs principales visibles dans le HTML/CSS. Réponds UNIQUEMENT en JSON valide, sans texte autour.
Page:
${html.slice(0, 20000)}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    });
    const text = result.response.text();
    const analysis = JSON.parse(text) as {
      colors?: { hex: string; name: string }[];
      toneOfVoice?: string;
      doAndDonts?: string;
      keywords?: string;
    };

    return Response.json({ analysis });
  } catch {
    return Response.json({ error: "Analyse IA impossible" }, { status: 500 });
  }
}
