"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Lien d'invitation invalide. Aucun token fourni.");
      return;
    }

    const acceptInvite = async () => {
      try {
        const res = await fetch("/api/workspaces/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json() as { error?: string };

        if (!res.ok) {
          setStatus("error");
          setMessage(data.error || "Erreur lors de l'acceptation");
          return;
        }

        setStatus("success");
        setMessage("Vous êtes maintenant membre de l'espace de travail !");
      } catch {
        setStatus("error");
        setMessage("Erreur réseau. Veuillez réessayer.");
      }
    };

    acceptInvite();
  }, [token]);

  return (
    <div className="h-full flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md text-center space-y-6"
      >
        {status === "loading" && (
          <div className="glass-card rounded-2xl p-12 space-y-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-12 h-12 border-3 border-primary/30 border-t-primary rounded-full mx-auto"
            />
            <p className="text-muted-foreground">Acceptation de l&apos;invitation...</p>
          </div>
        )}

        {status === "success" && (
          <div className="glass-card rounded-2xl p-12 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
              <CheckCircle className="text-emerald-500" size={36} />
            </div>
            <h2 className="text-2xl font-bold">Invitation acceptée !</h2>
            <p className="text-muted-foreground">{message}</p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium transition-all"
            >
              <ArrowLeft size={18} />
              Aller au Dashboard
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="glass-card rounded-2xl p-12 space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
              <XCircle className="text-red-500" size={36} />
            </div>
            <h2 className="text-2xl font-bold">Invitation invalide</h2>
            <p className="text-muted-foreground">{message}</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-medium transition-all"
            >
              <ArrowLeft size={18} />
              Retour à l&apos;accueil
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="h-full flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full"
        />
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  );
}
