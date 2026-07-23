import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { generateWithFallback } from "@/lib/gemini";

async function getUserWorkspaceId(userId: string) {
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId },
  });
  return membership?.workspaceId ?? null;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(request);
  if (!session) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  const workspaceId = await getUserWorkspaceId(session.userId);
  if (!workspaceId) {
    return Response.json({ error: "Aucun workspace trouvé" }, { status: 404 });
  }

  const { id } = await params;
  const { action, selection } = await request.json() as {
    action: "continue" | "rewrite" | "summarize" | "expand" | "simplify" | "fix";
    selection?: string;
  };

  const document = await prisma.document.findFirst({
    where: { id, workspaceId },
  });

  if (!document) {
    return Response.json({ error: "Document non trouvé" }, { status: 404 });
  }

  const contentJson = document.content as Record<string, unknown> | null;
  const htmlContent = contentJson
    ? JSON.stringify(contentJson)
    : "";

  const prompts: Record<string, string> = {
    continue: `Continue à écrire ce texte de manière naturelle et cohérente. Ne répète pas ce qui a déjà été écrit. Garde le même ton et style.\n\nTexte actuel :\n${htmlContent.slice(-2000)}`,
    rewrite: `Réécris le texte suivant de manière plus claire et engageante. Garde le sens original mais améliore le style.\n\nTexte :\n${selection || htmlContent.slice(-2000)}`,
    summarize: `Résume ce texte en 2-3 paragraphes concis. Extrais les points clés.\n\nTexte :\n${htmlContent}`,
    expand: `Développe et enrichis ce texte avec plus de détails, exemples et arguments.\n\nTexte :\n${selection || htmlContent.slice(-2000)}`,
    simplify: `Simplifie ce texte pour le rendre plus facile à lire. Utilise des mots plus simples et des phrases plus courtes.\n\nTexte :\n${selection || htmlContent.slice(-2000)}`,
    fix: `Corrige les fautes d'orthographe, de grammaire et de syntaxe dans ce texte. Ne change pas le sens.\n\nTexte :\n${selection || htmlContent}`,
  };

  try {
    const { text } = await generateWithFallback(
      { contents: [{ role: "user", parts: [{ text: prompts[action] || prompts.continue }] }] },
      "Tu es un rédacteur expert francophone. Tu écris du contenu de qualité professionnelle.",
      { temperature: 0.7, maxOutputTokens: 2048 }
    );

    return Response.json({ result: text });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Erreur IA" },
      { status: 500 }
    );
  }
}
