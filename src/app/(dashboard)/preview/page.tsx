"use client";

import React, { useState, useEffect } from "react";
import { Eye, Monitor, Smartphone, AlertCircle, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Linkify from "@/components/Linkify";

type Post = {
  id: string;
  body: string;
  platform: string;
  status: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  content?: { sourceIdea: string; campaign?: { title: string } };
};

type Platform = "linkedin" | "twitter" | "instagram" | "facebook";

const PLATFORMS: { key: Platform; label: string; color: string; iconChar: string }[] = [
  { key: "linkedin", label: "LinkedIn", color: "text-blue-400", iconChar: "in" },
  { key: "twitter", label: "X / Twitter", color: "text-sky-400", iconChar: "X" },
  { key: "instagram", label: "Instagram", color: "text-pink-400", iconChar: "IG" },
  { key: "facebook", label: "Facebook", color: "text-blue-300", iconChar: "f" },
];

const PLATFORM_BADGE: Record<string, string> = {
  linkedin: "bg-blue-600/20 text-blue-400 border-blue-500/20",
  twitter: "bg-sky-500/20 text-sky-400 border-sky-500/20",
  instagram: "bg-pink-500/20 text-pink-400 border-pink-500/20",
  facebook: "bg-blue-800/20 text-blue-300 border-blue-700/20",
};

function LinkedInPreview({ post }: { post: Post }) {
  return (
    <div className="bg-white rounded-lg shadow-lg max-w-lg mx-auto overflow-hidden">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">AC</div>
          <div>
            <p className="font-semibold text-sm text-gray-900">Autocontent</p>
            <p className="text-xs text-gray-500">SaaS de Marketing de Contenu</p>
          </div>
        </div>
        <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed"><Linkify>{post.body}</Linkify></p>
      </div>
      <div className="border-t border-gray-100 px-4 py-2 flex items-center justify-between text-xs text-gray-500">
        <span>👍 0 · 💬 0 · 🔄 0</span>
      </div>
    </div>
  );
}

function TwitterPreview({ post }: { post: Post }) {
  return (
    <div className="bg-white rounded-xl shadow-lg max-w-lg mx-auto p-4">
      <div className="flex gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0">AC</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 text-sm">
            <span className="font-bold text-gray-900">Autocontent</span>
            <span className="text-gray-500">@autocontent · maintenant</span>
          </div>
          <p className="text-sm text-gray-800 mt-1 whitespace-pre-wrap leading-relaxed"><Linkify>{post.body}</Linkify></p>
          <div className="flex items-center gap-8 mt-3 text-xs text-gray-500">
            <span>💬 0</span>
            <span>🔄 0</span>
            <span>❤️ 0</span>
            <span>📊 0</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function InstagramPreview({ post }: { post: Post }) {
  return (
    <div className="bg-white rounded-xl shadow-lg max-w-sm mx-auto overflow-hidden">
      <div className="p-3 flex items-center gap-3 border-b border-gray-100">
        <div className="w-8 h-8 bg-gradient-to-br from-pink-500 via-purple-500 to-orange-400 rounded-full p-[2px]">
          <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-[10px] font-bold text-gray-900">AC</div>
        </div>
        <span className="text-sm font-semibold text-gray-900">autocontent</span>
      </div>
      <div className="bg-gradient-to-br from-purple-100 via-pink-50 to-orange-50 aspect-square flex items-center justify-center p-6">
        <p className="text-center text-gray-700 text-sm leading-relaxed italic"><Linkify>{post.body}</Linkify></p>
      </div>
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-4 text-xl">
          <span>♡</span><span>💬</span><span>↗</span>
        </div>
        <p className="text-xs text-gray-500">Aucune appréciation</p>
      </div>
    </div>
  );
}

function FacebookPreview({ post }: { post: Post }) {
  return (
    <div className="bg-white rounded-xl shadow-lg max-w-lg mx-auto overflow-hidden">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">AC</div>
          <div>
            <p className="font-semibold text-sm text-gray-900">Autocontent</p>
            <p className="text-xs text-gray-500">Il y a quelques instants</p>
          </div>
        </div>
        <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed mb-3"><Linkify>{post.body}</Linkify></p>
      </div>
      <div className="border-t border-gray-100 px-4 py-2 flex items-center justify-between text-xs text-gray-500">
        <span>👍 J&apos;aime · 💬 Commenter · ↗ Partager</span>
      </div>
    </div>
  );
}

const PREVIEW_COMPONENTS: Record<Platform, React.ComponentType<{ post: Post }>> = {
  linkedin: LinkedInPreview,
  twitter: TwitterPreview,
  instagram: InstagramPreview,
  facebook: FacebookPreview,
};

export default function PreviewPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("linkedin");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [deviceMode, setDeviceMode] = useState<"desktop" | "mobile">("desktop");

  useEffect(() => {
    setLoading(true);
    fetch("/api/posts?status=PUBLISHED&limit=10")
      .then((res) => {
        if (!res.ok) throw new Error("Erreur chargement");
        return res.json() as Promise<{ posts: Post[] }>;
      })
      .then((data) => {
        setPosts(data.posts || []);
        if (data.posts.length > 0) setSelectedPost(data.posts[0]);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const PreviewComponent = PREVIEW_COMPONENTS[selectedPlatform];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Eye className="text-primary" size={28} />
          Aperçu Multi-Plateforme
        </h2>
        <p className="text-muted-foreground mt-1">Visualisez vos contenus tels qu&apos;ils apparaîtront sur chaque réseau social.</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Post list */}
        <div className="glass-card rounded-2xl p-4 max-h-[600px] overflow-y-auto">
          <h3 className="font-bold text-sm mb-3 text-muted-foreground uppercase tracking-wider">Publications</h3>
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw size={20} className="animate-spin text-muted-foreground" />
            </div>
          ) : posts.length === 0 ? (
            <p className="text-sm text-muted-foreground italic text-center py-8">Aucune publication.</p>
          ) : (
            <div className="space-y-2">
              {posts.map((post) => (
                <button
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  className={`w-full text-left p-3 rounded-xl text-sm transition-all ${
                    selectedPost?.id === post.id
                      ? "bg-primary/10 border border-primary/20"
                      : "bg-white/[0.02] border border-white/5 hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${PLATFORM_BADGE[post.platform] || "bg-white/5 text-muted-foreground border-white/10"}`}>
                      {post.platform}
                    </span>
                  </div>
                  <p className="text-xs text-foreground line-clamp-2">{post.body.slice(0, 100)}...</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Preview area */}
        <div className="lg:col-span-2 space-y-4">
          {/* Platform tabs + device toggle */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setSelectedPlatform(p.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedPlatform === p.key
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:bg-white/[0.05] border border-transparent"
                  }`}
                >
                  <span className={`text-xs font-bold ${selectedPlatform === p.key ? p.color : ""}`}>{p.iconChar}</span>
                  <span className="hidden sm:inline">{p.label}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-white/5 border border-white/10">
              <button
                onClick={() => setDeviceMode("desktop")}
                className={`p-2 rounded-md transition-all ${deviceMode === "desktop" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Monitor size={16} />
              </button>
              <button
                onClick={() => setDeviceMode("mobile")}
                className={`p-2 rounded-md transition-all ${deviceMode === "mobile" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Smartphone size={16} />
              </button>
            </div>
          </div>

          {/* Preview card */}
          <div className="glass-card rounded-2xl p-6 min-h-[400px] flex items-center justify-center bg-white/[0.01]">
            {selectedPost ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${selectedPost.id}-${selectedPlatform}-${deviceMode}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`w-full ${deviceMode === "mobile" ? "max-w-[320px]" : "max-w-xl"}`}
                >
                  <PreviewComponent post={selectedPost} />
                </motion.div>
              </AnimatePresence>
            ) : (
              <p className="text-muted-foreground text-sm">Sélectionnez un contenu à prévisualiser.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
