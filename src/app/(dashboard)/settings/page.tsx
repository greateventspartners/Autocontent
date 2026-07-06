"use client";

import React, { useState, useEffect } from "react";
import { Settings, Globe, Check, Link2, Users, Copy, UserPlus, AlertCircle, Shield, User, Eye } from "lucide-react";
import { motion } from "framer-motion";

interface Platform {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  color: string;
}

const platforms: Platform[] = [
  { id: "facebook", name: "Facebook", icon: "f", connected: false, color: "#1877F2" },
  { id: "instagram", name: "Instagram", icon: "ig", connected: false, color: "#E4405F" },
  { id: "linkedin", name: "LinkedIn", icon: "in", connected: false, color: "#0A66C2" },
  { id: "twitter", name: "X (Twitter)", icon: "X", connected: false, color: "#000000" },
  { id: "tiktok", name: "TikTok", icon: "tt", connected: false, color: "#000000" },
  { id: "youtube", name: "YouTube", icon: "YT", connected: false, color: "#FF0000" },
  { id: "pinterest", name: "Pinterest", icon: "P", connected: false, color: "#BD081C" },
  { id: "wordpress", name: "WordPress", icon: "W", connected: false, color: "#21759B" },
  { id: "medium", name: "Medium", icon: "M", connected: false, color: "#000000" },
  { id: "threads", name: "Threads", icon: "th", connected: false, color: "#000000" },
];

type Member = {
  id: string;
  role: string;
  user: { id: string; email: string; name: string | null };
};

const roleLabels: Record<string, string> = {
  OWNER: "Propriétaire",
  EDITOR: "Éditeur",
  CLIENT: "Client",
};

const roleIcons: Record<string, React.ElementType> = {
  OWNER: Shield,
  EDITOR: User,
  CLIENT: Eye,
};

export default function SettingsPage() {
  const [platformsState, setPlatformsState] = useState(platforms);
  const [saved, setSaved] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("EDITOR");
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [linkedinUser, setLinkedinUser] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("linkedin") === "connected") {
      setError("LinkedIn connecté avec succès !");
      setTimeout(() => setError(""), 3000);
    } else if (params.get("error") === "linkedin_denied") {
      setError("Connexion LinkedIn annulée");
    } else if (params.get("error") === "linkedin_failed") {
      setError("Échec de la connexion LinkedIn");
    }
    const url = new URL(window.location.href);
    url.searchParams.delete("linkedin");
    url.searchParams.delete("error");
    window.history.replaceState({}, "", url.toString());

    fetch("/api/workspaces/members")
      .then((res) => {
        if (!res.ok) throw new Error("Erreur chargement membres");
        return res.json() as Promise<{ members: Member[] }>;
      })
      .then((data) => setMembers(data.members))
      .catch((e) => setError(e.message))
      .finally(() => setLoadingMembers(false));

    fetch("/api/workspaces/connections")
      .then((res) => res.json() as Promise<{ connections: Array<{ platform: string; platformUserName: string | null }> }>)
      .then((data) => {
        const li = data.connections.find((c) => c.platform === "linkedin");
        if (li) {
          setLinkedinUser(li.platformUserName);
          setPlatformsState((prev) =>
            prev.map((p) => (p.id === "linkedin" ? { ...p, connected: true } : p))
          );
        }
      })
      .catch(() => {});
  }, []);

  const togglePlatform = (id: string) => {
    if (id === "linkedin") {
      if (linkedinUser) {
        handleLinkedinDisconnect();
      } else {
        window.location.href = "/api/auth/linkedin";
      }
      return;
    }
    setPlatformsState((prev) =>
      prev.map((p) => (p.id === id ? { ...p, connected: !p.connected } : p))
    );
  };

  const handleLinkedinDisconnect = async () => {
    setDisconnecting(true);
    try {
      await fetch("/api/auth/linkedin/disconnect", { method: "POST" });
      setLinkedinUser(null);
      setPlatformsState((prev) =>
        prev.map((p) => (p.id === "linkedin" ? { ...p, connected: false } : p))
      );
    } catch {
      setError("Erreur lors de la déconnexion LinkedIn");
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setSendingInvite(true);
    setInviteError("");
    setInviteLink("");

    try {
      const res = await fetch("/api/workspaces/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      const data = await res.json() as { error?: string; invite?: { link: string } };

      if (!res.ok) {
        setInviteError(data.error || "Erreur d'invitation");
        return;
      }

      setInviteLink(data.invite?.link || "");
      setInviteEmail("");
    } catch {
      setInviteError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setSendingInvite(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="text-primary" size={28} />
            Paramètres
          </h2>
          <p className="text-muted-foreground mt-1">
            Gérez vos plateformes, vos membres et les préférences de votre compte.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Membres du workspace */}
      <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-40 h-40 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <h3 className="text-lg font-bold flex items-center gap-2 mb-2">
            <Users className="text-primary" size={18} />
            Membres de l&apos;espace
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Gérez les accès à votre workspace.
          </p>

          {loadingMembers ? (
            <div className="flex justify-center py-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full"
              />
            </div>
          ) : (
            <div className="space-y-3 mb-6">
              {members.map((member) => {
                const RoleIcon = roleIcons[member.role] || User;
                return (
                  <div key={member.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                        {member.user.name
                          ? member.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                          : member.user.email[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{member.user.name || member.user.email}</p>
                        <p className="text-xs text-muted-foreground">{member.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <RoleIcon size={14} />
                      <span>{roleLabels[member.role] || member.role}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="border-t border-white/10 pt-6">
            <h4 className="font-bold text-sm mb-4 flex items-center gap-2">
              <UserPlus size={16} />
              Inviter un membre
            </h4>

            <div className="flex gap-3 mb-3">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="email@exemple.com"
                className="flex-1 p-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="p-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="EDITOR">Éditeur</option>
                <option value="CLIENT">Client</option>
              </select>
              <button
                onClick={handleInvite}
                disabled={!inviteEmail.trim() || sendingInvite}
                className="px-5 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium text-sm transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {sendingInvite ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                  />
                ) : (
                  "Inviter"
                )}
              </button>
            </div>

            {inviteError && (
              <p className="text-sm text-red-400 mt-2">{inviteError}</p>
            )}

            {inviteLink && (
              <div className="mt-4 p-4 rounded-xl bg-white/[0.02] border border-primary/20 space-y-2">
                <p className="text-xs text-muted-foreground">Lien d&apos;invitation (valable 7 jours) :</p>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={inviteLink}
                    className="flex-1 p-2 bg-white/5 border border-white/10 rounded-lg text-xs font-mono"
                  />
                  <button
                    onClick={copyLink}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Plateformes de publication */}
      <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-40 h-40 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <h3 className="text-lg font-bold flex items-center gap-2 mb-2">
            <Globe className="text-primary" size={18} />
            Plateformes de publication
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Activez les plateformes sur lesquelles vous souhaitez publier du contenu.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {platformsState.map((platform, i) => (
              <motion.button
                key={platform.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => togglePlatform(platform.id)}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                  platform.connected
                    ? "border-primary/40 bg-primary/5"
                    : "border-white/10 dark:border-white/10 bg-white/[0.02] dark:bg-white/[0.02] hover:bg-white/5 dark:hover:bg-white/5"
                }`}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ backgroundColor: platform.color }}
                >
                  {platform.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{platform.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {platform.id === "linkedin" && linkedinUser
                      ? `Connecté en tant que ${linkedinUser}`
                      : platform.connected
                        ? "Connecté"
                        : platform.id === "linkedin"
                          ? "Cliquer pour connecter"
                          : "Bientôt disponible"}
                  </p>
                </div>
                <div
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                    platform.connected
                      ? "bg-primary border-primary"
                      : "border-white/20"
                  }`}
                >
                  {platform.connected && <Check size={14} className="text-primary-foreground" />}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/25 font-medium text-sm flex items-center gap-2 transition-transform active:scale-95"
        >
          <Check size={16} />
          {saved ? "Enregistré !" : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}
