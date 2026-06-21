"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getChannelLabel } from "@/components/PlatformIcon";

interface ReviewData {
  review: {
    id: string;
    token: string;
    status: string;
    comments: string | null;
    reviewerEmail: string | null;
    reviewerName: string | null;
    respondedAt: string | null;
  };
  contentItem: {
    id: string;
    title: string;
    content: string;
    variantA: string;
    variantB: string;
    channel: string;
    type: string;
    status: string;
    createdAt: string;
    brandKit: { name: string } | null;
  };
  alreadyResponded: boolean;
}

export default function ReviewPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [decision, setDecision] = useState<"APPROVED" | "CHANGES_REQUESTED" | null>(null);
  const [comments, setComments] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/review/${token}`)
      .then((r) => (r.ok ? r.json() : Promise.reject("Lien invalide")))
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async () => {
    if (!decision) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/review/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: decision, comments }),
      });
      if (!res.ok) throw new Error("Erreur lors de l'envoi");
      setDone(true);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-500 text-sm">Chargement...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="glass-panel p-8 rounded-2xl text-center">
          <p className="text-red-400 text-sm font-semibold">Lien invalide ou expiré</p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="glass-panel p-8 rounded-2xl text-center space-y-4">
          <div className="text-4xl">{decision === "APPROVED" ? "✅" : "📝"}</div>
          <h1 className="text-lg font-bold text-white">Merci pour votre retour !</h1>
          <p className="text-sm text-zinc-400">
            {decision === "APPROVED"
              ? "La publication a été approuvée."
              : "Vos commentaires ont été transmis."}
          </p>
        </div>
      </div>
    );
  }

  if (data.alreadyResponded) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="glass-panel p-8 rounded-2xl text-center space-y-4">
          <div className="text-4xl">🔒</div>
          <h1 className="text-lg font-bold text-white">Déjà répondu</h1>
          <p className="text-sm text-zinc-400">
            Ce lien a déjà été utilisé.
          </p>
        </div>
      </div>
    );
  }

  const item = data.contentItem;
  const variantA = item.variantA || item.content;
  const variantB = item.variantB || "";

  return (
    <div className="min-h-screen bg-zinc-950 py-8 sm:py-12 px-4">
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <div className="glass-panel p-6 rounded-2xl text-center">
          <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-semibold mb-1">
            Révision de contenu
          </p>
          <h1 className="text-xl font-bold text-white">{item.title}</h1>
          <div className="flex items-center justify-center gap-3 mt-3 text-xs text-zinc-500">
            <span className="bg-zinc-800 px-2 py-0.5 rounded">{getChannelLabel(item.channel)}</span>
            {item.brandKit && (
              <span className="text-zinc-600">{item.brandKit.name}</span>
            )}
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl space-y-6">
          <div>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Variante A
            </h3>
            <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
              {variantA}
            </div>
          </div>

          {variantB && (
            <div>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Variante B
              </h3>
              <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                {variantB}
              </div>
            </div>
          )}
        </div>

        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Votre décision
          </h3>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setDecision("APPROVED")}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition cursor-pointer ${
                decision === "APPROVED"
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                  : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700"
              }`}
            >
              ✅ Approuver
            </button>
            <button
              type="button"
              onClick={() => setDecision("CHANGES_REQUESTED")}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition cursor-pointer ${
                decision === "CHANGES_REQUESTED"
                  ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                  : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700"
              }`}
            >
              📝 Modifications
            </button>
          </div>

          {decision === "CHANGES_REQUESTED" && (
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Décrivez les modifications souhaitées..."
              rows={4}
              className="w-full rounded-xl bg-zinc-950 border border-zinc-800 p-4 text-sm text-zinc-300 focus:outline-none focus:border-primary"
            />
          )}

          {decision && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-primary hover:bg-opacity-90 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-semibold transition cursor-pointer"
            >
              {submitting ? "Envoi en cours..." : "Envoyer la réponse"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
