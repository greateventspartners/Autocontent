"use client";

import React, { useState, useEffect } from "react";
import { Settings, Globe, Check, Users, Copy, UserPlus, AlertCircle, Shield, User, Eye, X } from "lucide-react";
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
  ADMIN: "Administrateur",
  EDITOR: "Éditeur",
  VIEWER: "Lecteur",
};

const roleIcons: Record<string, React.ElementType> = {
  OWNER: Shield,
  ADMIN: Shield,
  EDITOR: User,
  VIEWER: Eye,
};

const roleDescriptions: Record<string, string> = {
  OWNER: "Contrôle total du workspace",
  ADMIN: "Gère les membres et les paramètres",
  EDITOR: "Crée et édite le contenu",
  VIEWER: "Consulte uniquement",
};

const platformOAuthMap: Record<string, string> = {
  facebook: "/api/auth/facebook",
  instagram: "/api/auth/facebook",
  linkedin: "/api/auth/linkedin",
  tiktok: "/api/auth/tiktok",
  youtube: "/api/auth/youtube",
  pinterest: "/api/auth/pinterest",
  wordpress: "/api/auth/wordpress",
  medium: "/api/auth/medium",
  threads: "/api/auth/facebook",
};

const platformDisconnectMap: Record<string, string> = {
  facebook: "/api/auth/facebook/disconnect",
  instagram: "/api/auth/facebook/disconnect",
  linkedin: "/api/auth/linkedin/disconnect",
  tiktok: "/api/auth/tiktok/disconnect",
  youtube: "/api/auth/youtube/disconnect",
  pinterest: "/api/auth/pinterest/disconnect",
  wordpress: "/api/auth/wordpress/disconnect",
  medium: "/api/auth/medium/disconnect",
  threads: "/api/auth/facebook/disconnect",
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
  const [platformUsers, setPlatformUsers] = useState<Record<string, string | null>>({});
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const successMessages: Record<string, string> = {
      facebook: "Facebook connecté avec succès !",
      instagram: "Instagram connecté avec succès !",
      linkedin: "LinkedIn connecté avec succès !",
      tiktok: "TikTok connecté avec succès !",
      youtube: "YouTube connecté avec succès !",
      pinterest: "Pinterest connecté avec succès !",
      wordpress: "WordPress connecté avec succès !",
      medium: "Medium connecté avec succès !",
    };

    const errorMessages: Record<string, string> = {
      facebook_denied: "Connexion Facebook annulée",
      facebook_failed: "Échec de la connexion Facebook",
      instagram_denied: "Connexion Instagram annulée",
      instagram_failed: "Échec de la connexion Instagram",
      linkedin_denied: "Connexion LinkedIn annulée",
      linkedin_failed: "Échec de la connexion LinkedIn",
      tiktok_denied: "Connexion TikTok annulée",
      tiktok_failed: "Échec de la connexion TikTok",
      youtube_denied: "Connexion YouTube annulée",
      youtube_failed: "Échec de la connexion YouTube",
      pinterest_denied: "Connexion Pinterest annulée",
      pinterest_failed: "Échec de la connexion Pinterest",
      wordpress_denied: "Connexion WordPress annulée",
      wordpress_failed: "Échec de la connexion WordPress",
      medium_denied: "Connexion Medium annulée",
      medium_failed: "Échec de la connexion Medium",
    };

    let notificationMessage: string | null = null;

    for (const [key, msg] of Object.entries(successMessages)) {
      if (params.get(key) === "connected") {
        notificationMessage = msg;
        break;
      }
    }
    if (!notificationMessage) {
      const errorParam = params.get("error");
      if (errorParam && errorMessages[errorParam]) {
        notificationMessage = errorMessages[errorParam];
      }
    }

    const url = new URL(window.location.href);
    for (const key of [...Object.keys(successMessages), "error"]) {
      url.searchParams.delete(key);
    }
    window.history.replaceState({}, "", url.toString());

    if (notificationMessage) {
      setError(notificationMessage);
      setTimeout(() => setError(""), 4000);
    }

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
        const users: Record<string, string | null> = {};
        data.connections.forEach((c) => {
          users[c.platform] = c.platformUserName;
        });
        setPlatformUsers(users);
        setPlatformsState((prev) =>
          prev.map((p) => ({
            ...p,
            connected: !!users[p.id],
          }))
        );
      })
      .catch(() => {});
  }, []);

  const togglePlatform = (id: string) => {
    if (platformUsers[id]) {
      handleDisconnect(id);
    } else {
      const oauthUrl = platformOAuthMap[id];
      if (oauthUrl) {
        window.location.assign(oauthUrl);
      }
    }
  };

  const handleDisconnect = async (platformId: string) => {
    setDisconnecting(platformId);
    try {
      const disconnectUrl = platformDisconnectMap[platformId];
      if (disconnectUrl) {
        await fetch(disconnectUrl, { method: "POST" });
      }
      setPlatformUsers((prev) => {
        const next = { ...prev };
        delete next[platformId];
        return next;
      });
      setPlatformsState((prev) =>
        prev.map((p) => (p.id === platformId ? { ...p, connected: false } : p))
      );
    } catch {
      setError(`Erreur lors de la déconnexion ${platformId}`);
    } finally {
      setDisconnecting(null);
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

  const handleRoleChange = async (memberId: string, newRole: string) => {
    setUpdatingRole(memberId);
    try {
      const res = await fetch(`/api/workspaces/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error || "Erreur lors de la mise à jour du rôle");
      }
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de la mise à jour du rôle");
    } finally {
      setUpdatingRole(null);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir retirer ce membre ?")) return;
    try {
      const res = await fetch(`/api/workspaces/members/${memberId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error || "Erreur lors du retrait du membre");
      }
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors du retrait du membre");
    }
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
                const isOwner = member.role === "OWNER";
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
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">{roleDescriptions[member.role]}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isOwner ? (
                        <div className="flex items-center gap-1.5 text-xs text-amber-400 px-2 py-1 rounded-lg bg-amber-500/10">
                          <Shield size={12} />
                          <span>Propriétaire</span>
                        </div>
                      ) : (
                        <>
                          <select
                            value={member.role}
                            onChange={(e) => handleRoleChange(member.id, e.target.value)}
                            disabled={updatingRole === member.id}
                            className="p-1.5 bg-white/5 border border-white/10 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50"
                          >
                            <option value="ADMIN">Admin</option>
                            <option value="EDITOR">Éditeur</option>
                            <option value="VIEWER">Lecteur</option>
                          </select>
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Retirer du workspace"
                          >
                            <X size={14} />
                          </button>
                        </>
                      )}
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

            <div className="flex flex-col sm:flex-row gap-3 mb-3">
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
                <option value="ADMIN">Administrateur</option>
                <option value="EDITOR">Éditeur</option>
                <option value="VIEWER">Lecteur</option>
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
            Connectez vos comptes pour publier directement depuis Autocontent.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {platformsState.map((platform, i) => (
              <motion.button
                key={platform.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => togglePlatform(platform.id)}
                disabled={disconnecting === platform.id}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                  platform.connected
                    ? "border-primary/40 bg-primary/5"
                    : "border-white/10 dark:border-white/10 bg-white/[0.02] dark:bg-white/[0.02] hover:bg-white/5 dark:hover:bg-white/5"
                } ${disconnecting === platform.id ? "opacity-60" : ""}`}
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
                    {platformUsers[platform.id]
                      ? `Connecté${platformUsers[platform.id] ? ` — ${platformUsers[platform.id]}` : ""}`
                      : platform.connected
                        ? "Connecté"
                        : "Cliquer pour connecter"}
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
