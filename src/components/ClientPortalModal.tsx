"use client";

import React, { useState, useEffect } from "react";
import { Link as LinkIcon, Copy, Check, X, Users, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type ClientTokenData = {
  id: string;
  token: string;
  clientName: string;
  clientEmail: string | null;
  expiresAt: string | null;
  createdAt: string;
};

interface ClientPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ClientPortalModal({ isOpen, onClose }: ClientPortalModalProps) {
  const [tokens, setTokens] = useState<ClientTokenData[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [expiry, setExpiry] = useState("7");
  const [creating, setCreating] = useState(false);
  const [newLink, setNewLink] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch("/api/client-portal")
      .then((r) => r.json() as Promise<{ tokens?: ClientTokenData[] }>)
      .then((d) => setTokens(d.tokens || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/client-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: name.trim(),
          clientEmail: email.trim() || undefined,
          expiresInDays: parseInt(expiry) || undefined,
        }),
      });
      const data = await res.json() as { link?: string; token?: string };
      if (data.link) {
        const fullLink = `${window.location.origin}${data.link}`;
        setNewLink(fullLink);
        setTokens((prev) => [{ id: data.token!, token: data.token!, clientName: name, clientEmail: email || null, expiresAt: null, createdAt: new Date().toISOString() }, ...prev]);
        setName("");
        setEmail("");
      }
    } catch {}
    setCreating(false);
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-lg max-h-[85vh] overflow-y-auto glass-card rounded-2xl p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold">Portail Client</h2>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-accent rounded-lg"><X size={18} /></button>
          </div>

          {/* Create new */}
          <div className="space-y-3 mb-6 p-4 rounded-xl bg-background/50 border border-border">
            <h3 className="text-sm font-semibold">Créer un lien</h3>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom du client"
              className="w-full px-3 py-2 bg-background/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email (optionnel)"
              className="w-full px-3 py-2 bg-background/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <div className="flex gap-3">
              <select
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                className="flex-1 px-3 py-2 bg-background/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="3">3 jours</option>
                <option value="7">7 jours</option>
                <option value="14">14 jours</option>
                <option value="30">30 jours</option>
                <option value="">Pas d&apos;expiration</option>
              </select>
              <button
                onClick={handleCreate}
                disabled={!name.trim() || creating}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium disabled:opacity-50"
              >
                {creating ? "..." : "Créer"}
              </button>
            </div>
          </div>

          {/* New link */}
          {newLink && (
            <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20">
              <p className="text-xs text-muted-foreground mb-2">Lien généré :</p>
              <div className="flex gap-2">
                <input readOnly value={newLink} className="flex-1 px-3 py-2 bg-background/50 border border-border rounded-lg text-xs font-mono" />
                <button onClick={() => copyLink(newLink)} className="p-2 bg-primary/10 hover:bg-primary/20 rounded-lg">
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          )}

          {/* Existing tokens */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Liens existants</h3>
            {loading ? (
              <p className="text-xs text-muted-foreground text-center py-4">Chargement...</p>
            ) : tokens.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Aucun lien créé.</p>
            ) : (
              <div className="space-y-2">
                {tokens.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-background/30 border border-border">
                    <div>
                      <p className="text-sm font-medium">{t.clientName}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Créé le {new Date(t.createdAt).toLocaleDateString("fr-FR")}
                        {t.expiresAt && ` • expire le ${new Date(t.expiresAt).toLocaleDateString("fr-FR")}`}
                      </p>
                    </div>
                    <button
                      onClick={() => copyLink(`${window.location.origin}/client/${t.token}`)}
                      className="p-1.5 hover:bg-accent rounded-lg"
                    >
                      <LinkIcon size={14} className="text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
