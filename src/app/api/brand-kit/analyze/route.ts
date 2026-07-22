import { generateWithFallback } from "@/lib/gemini";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { url }: { url?: string } = await request.json();
  if (!url) {
    return Response.json({ error: "URL requise" }, { status: 400 });
  }

  const targetUrl = url.startsWith("http") ? url : `https://${url}`;

  let html = "";
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.5",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return Response.json(
        { error: `Le site a retourné une erreur HTTP ${res.status}` },
        { status: 502 }
      );
    }

    html = await res.text();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erreur inconnue";
    console.error("[analyze] Fetch error:", msg);
    return Response.json(
      { error: `Impossible de récupérer le site: ${msg}` },
      { status: 502 }
    );
  }

  if (!html || html.length < 50) {
    return Response.json(
      { error: "Le site a retourné une page vide ou trop courte." },
      { status: 502 }
    );
  }

  try {
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

    const { text } = await generateWithFallback(
      { contents: [{ role: "user", parts: [{ text: prompt }] }] },
      undefined,
      { responseMimeType: "application/json" },
    );
    const analysis = JSON.parse(text) as {
      colors?: { hex: string; name: string }[];
      toneOfVoice?: string;
      doAndDonts?: string;
      keywords?: string;
    };

    return Response.json({ analysis });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erreur inconnue";
    console.error("[analyze] Gemini error:", msg);
    return Response.json({ error: `Analyse IA impossible: ${msg}` }, { status: 500 });
  }
}
