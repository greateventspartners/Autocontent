"use client";

import React, { useState, useEffect } from "react";
import { Mail, Lock, ArrowRight, Eye, EyeOff, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

const errorMessages: Record<string, string> = {
  google_denied: "Connexion Google annulée.",
  google_invalid: "Réponse Google invalide.",
  google_state_mismatch: "Erreur de sécurité. Réessayez.",
  google_failed: "Erreur lors de la connexion Google.",
  account_exists_with_email: "Un compte avec cet email existe déjà avec un mot de passe. Connectez-vous avec votre email.",
  auth_required: "Veuillez vous connecter.",
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err && errorMessages[err]) {
      setError(errorMessages[err]);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data: { error?: string } = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur de connexion");
        return;
      }

      window.location.href = "/dashboard";
    } catch {
      setError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center"
        style={{
          backgroundImage: "url(https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=2070&auto=format&fit=crop)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#020817]/90 via-[#020817]/70 to-[#020817]/60"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-purple-600/20 to-pink-500/20"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }}></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/15 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: "2s" }}></div>

        <div className="relative z-10 max-w-md px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center shadow-2xl shadow-primary/40 mx-auto mb-8">
              <span className="text-white font-bold text-3xl">A</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight mb-4">Autocontent</h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Créez, planifiez et publiez votre contenu sur tous vos réseaux sociaux grace à l&apos;IA.
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.6 }} className="mt-12 grid grid-cols-3 gap-4">
            {["124 Posts/mois", "8 Canaux", "5s Génération"].map((stat, i) => (
              <div key={i} className="glass-card rounded-xl p-4 text-center">
                <p className="text-sm font-bold text-foreground">{stat.split(" ")[0]}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.split(" ").slice(1).join(" ")}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md space-y-8">
          <Link href="/" className="lg:hidden flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="text-2xl font-bold tracking-tight">Autocontent</span>
          </Link>

          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight">Bon retour !</h2>
            <p className="text-muted-foreground mt-2">Connectez-vous à votre espace de travail.</p>
          </div>

          <div className="space-y-3">
            <a href="/api/auth/google" className="w-full py-3 px-4 glass-card rounded-xl flex items-center justify-center gap-3 font-medium text-sm hover:bg-white/10 transition-all group border border-white/10">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuer avec Google
            </a>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="absolute w-full border-t border-white/10"></div>
            <span className="relative px-4 text-xs text-muted-foreground bg-background">ou par email</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Adresse email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@entreprise.com"
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/70" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-sm font-medium">Mot de passe</label>
                <Link href="/forgot-password" className="text-xs text-primary hover:underline">Mot de passe oublié ?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/70" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl">
                <AlertCircle size={16} className="shrink-0" /><span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={isLoading}
              className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/25 font-bold flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] disabled:opacity-70">
              {isLoading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
              ) : (<>Se connecter<ArrowRight size={18} /></>)}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Pas encore de compte ?{" "}
            <Link href="/register" className="text-primary font-medium hover:underline">Créer un compte gratuitement</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
