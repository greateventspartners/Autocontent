"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  FileText, Plus, Trash2, Clock, Search, ChevronLeft,
  Sparkles, ArrowUpRight, Copy, Download, MoreHorizontal,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

const DocumentEditor = dynamic(
  () => import("@/components/editor/DocumentEditor").then((m) => m.default),
  { ssr: false }
);

type Document = {
  id: string;
  title: string;
  wordCount: number;
  tags: string | null;
  createdAt: string;
  updatedAt: string;
};

type DocumentFull = Document & {
  content: unknown;
};

const AI_ACTIONS = [
  { id: "continue", label: "Continuer", icon: "✍️", desc: " poursuivre la rédaction" },
  { id: "rewrite", label: "Réécrire", icon: "🔄", desc: " reformuler le texte sélectionné" },
  { id: "expand", label: "Développer", icon: "📝", desc: " enrichir avec plus de détails" },
  { id: "simplify", label: "Simplifier", icon: "✨", desc: " rendre plus clair et lisible" },
  { id: "summarize", label: "Résumer", icon: "📋", desc: " extraire les points clés" },
  { id: "fix", label: "Corriger", icon: "🔧", desc: " corriger les fautes" },
] as const;

function wordCountFromHtml(html: string): number {
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return text ? text.split(" ").length : 0;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Hier";
  if (days < 7) return `Il y a ${days}j`;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDoc, setActiveDoc] = useState<DocumentFull | null>(null);
  const [editorContent, setEditorContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [aiAction, setAiAction] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showList, setShowList] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchDocs = useCallback(async () => {
    try {
      const res = await fetch("/api/documents");
      const data = await res.json() as { documents?: Document[] };
      setDocuments(data.documents ?? []);
    } catch { /* noop */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const openDoc = async (id: string) => {
    try {
      const res = await fetch(`/api/documents/${id}`);
      const data = (await res.json()) as { document?: DocumentFull };
      if (data.document) {
        setActiveDoc(data.document);
        const content = data.document.content;
        setEditorContent(
          typeof content === "string"
            ? content
            : content
            ? JSON.stringify(content)
            : ""
        );
        setShowList(false);
      }
    } catch { /* noop */ }
  };

  const createDoc = async () => {
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Sans titre", content: "" }),
      });
      const data = (await res.json()) as { document?: DocumentFull };
      if (data.document) {
        setDocuments((prev) => [{ ...data.document!, content: undefined }, ...prev]);
        openDoc(data.document.id);
      }
    } catch { /* noop */ }
  };

  const deleteDoc = async (id: string) => {
    try {
      await fetch(`/api/documents/${id}`, { method: "DELETE" });
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      if (activeDoc?.id === id) {
        setActiveDoc(null);
        setEditorContent("");
        setShowList(true);
      }
    } catch { /* noop */ }
  };

  const handleContentChange = (content: string) => {
    setEditorContent(content);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      if (!activeDoc) return;
      setSaving(true);
      try {
        const wc = wordCountFromHtml(content);
        await fetch(`/api/documents/${activeDoc.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, wordCount: wc }),
        });
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === activeDoc.id
              ? { ...d, wordCount: wc, updatedAt: new Date().toISOString() }
              : d
          )
        );
      } catch { /* noop */ }
      setSaving(false);
    }, 1000);
  };

  const handleTitleChange = async (title: string) => {
    if (!activeDoc) return;
    setActiveDoc({ ...activeDoc, title });
    setDocuments((prev) =>
      prev.map((d) => (d.id === activeDoc.id ? { ...d, title } : d))
    );
    try {
      await fetch(`/api/documents/${activeDoc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
    } catch { /* noop */ }
  };

  const runAI = async (action: string) => {
    if (!activeDoc) return;
    setAiLoading(true);
    setAiAction(action);
    setAiResult(null);
    try {
      const res = await fetch(`/api/documents/${activeDoc.id}/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await res.json()) as { result?: string; error?: string };
      if (data.result) {
        setAiResult(data.result);
      } else {
        setAiResult(data.error || "Erreur IA");
      }
    } catch {
      setAiResult("Erreur réseau");
    }
    setAiLoading(false);
  };

  const applyAIResult = () => {
    if (!aiResult || !activeDoc) return;
    if (aiAction === "continue" || aiAction === "expand") {
      const newContent = editorContent + "\n\n" + aiResult;
      setEditorContent(newContent);
      handleContentChange(newContent);
    } else {
      setEditorContent(aiResult);
      handleContentChange(aiResult);
    }
    setAiResult(null);
    setAiAction(null);
    setShowAI(false);
  };

  const exportDoc = (format: "md" | "txt") => {
    if (!editorContent) return;
    const text = editorContent.replace(/<[^>]*>/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeDoc?.title || "document"}.${format === "md" ? "md" : "txt"}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredDocs = documents.filter(
    (d) =>
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      (d.tags && d.tags.toLowerCase().includes(search.toLowerCase()))
  );

  const totalWords = documents.reduce((sum, d) => sum + d.wordCount, 0);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-7rem)] flex gap-4">
      {/* Sidebar - Document List */}
      <div className={`${showList ? "flex" : "hidden"} md:flex w-full md:w-80 shrink-0 flex-col glass-card rounded-2xl overflow-hidden`}>
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <FileText size={18} className="text-primary" />
              Documents
            </h2>
            <button onClick={createDoc}
              className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
              <Plus size={16} />
            </button>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-9 pr-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div className="flex items-center gap-3 mt-3 text-[11px] text-muted-foreground">
            <span>{documents.length} documents</span>
            <span>·</span>
            <span>{totalWords.toLocaleString()} mots</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredDocs.length === 0 ? (
            <div className="text-center py-8">
              <FileText size={24} className="text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">
                {documents.length === 0 ? "Aucun document. Créez-en un !" : "Aucun résultat."}
              </p>
            </div>
          ) : (
            filteredDocs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => openDoc(doc.id)}
                className={`group p-3 rounded-xl cursor-pointer transition-all ${
                  activeDoc?.id === doc.id
                    ? "bg-primary/10 border border-primary/20"
                    : "hover:bg-white/[0.02] border border-transparent"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.title || "Sans titre"}</p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                      <Clock size={10} />
                      <span>{formatDate(doc.updatedAt)}</span>
                      <span>·</span>
                      <span>{doc.wordCount.toLocaleString()} mots</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteDoc(doc.id); }}
                    className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Editor Area */}
      <div className={`${showList ? "hidden" : "flex"} md:flex flex-1 flex-col glass-card rounded-2xl overflow-hidden`}>
        {activeDoc ? (
          <>
            {/* Editor Header */}
            <div className="px-4 py-3 border-b border-white/5 flex items-center gap-3">
              <button onClick={() => setShowList(true)} className="md:hidden p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground">
                <ChevronLeft size={16} />
              </button>
              <input
                value={activeDoc.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="flex-1 bg-transparent text-lg font-bold focus:outline-none placeholder:text-muted-foreground/50"
                placeholder="Titre du document..."
              />
              <div className="flex items-center gap-1">
                {saving && (
                  <span className="text-[10px] text-muted-foreground mr-2">Sauvegarde...</span>
                )}
                <button onClick={() => setShowAI(!showAI)}
                  className={`p-2 rounded-lg transition-colors ${showAI ? "bg-primary/20 text-primary" : "hover:bg-white/5 text-muted-foreground"}`}
                  title="Assistance IA">
                  <Sparkles size={16} />
                </button>
                <div className="relative group">
                  <button className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground">
                    <MoreHorizontal size={16} />
                  </button>
                  <div className="absolute right-0 top-full mt-1 w-40 py-1 bg-slate-800 border border-white/10 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-10">
                    <button onClick={() => exportDoc("md")} className="w-full px-3 py-2 text-xs text-left hover:bg-white/5 flex items-center gap-2">
                      <Download size={12} /> Exporter Markdown
                    </button>
                    <button onClick={() => exportDoc("txt")} className="w-full px-3 py-2 text-xs text-left hover:bg-white/5 flex items-center gap-2">
                      <Download size={12} /> Exporter Texte
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 flex min-h-0">
              {/* Editor */}
              <div className="flex-1 overflow-hidden">
                <DocumentEditor
                  content={editorContent}
                  onChange={handleContentChange}
                  placeholder="Commencez à écrire votre document..."
                />
              </div>

              {/* AI Panel */}
              <AnimatePresence>
                {showAI && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 300, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="border-l border-white/5 overflow-hidden shrink-0"
                  >
                    <div className="w-[300px] p-4 h-full flex flex-col">
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles size={16} className="text-primary" />
                        <h3 className="text-sm font-bold">Assistance IA</h3>
                      </div>

                      <div className="space-y-2 mb-4">
                        {AI_ACTIONS.map((a) => (
                          <button
                            key={a.id}
                            onClick={() => runAI(a.id)}
                            disabled={aiLoading}
                            className="w-full p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all text-left disabled:opacity-50"
                          >
                            <div className="flex items-center gap-2">
                              <span>{a.icon}</span>
                              <span className="text-sm font-medium">{a.label}</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{a.desc}</p>
                          </button>
                        ))}
                      </div>

                      {aiLoading && (
                        <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-xl">
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                            className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full" />
                          <span className="text-xs text-primary">Génération en cours...</span>
                        </div>
                      )}

                      {aiResult && (
                        <div className="flex-1 overflow-y-auto">
                          <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl mb-3">
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{aiResult}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={applyAIResult}
                              className="flex-1 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-medium flex items-center justify-center gap-1">
                              <ArrowUpRight size={12} /> Appliquer
                            </button>
                            <button onClick={() => { navigator.clipboard.writeText(aiResult); }}
                              className="py-2 px-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-medium text-muted-foreground">
                              <Copy size={12} />
                            </button>
                            <button onClick={() => setAiResult(null)}
                              className="py-2 px-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-medium text-muted-foreground">
                              ✕
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <FileText size={28} className="text-primary" />
              </div>
              <p className="text-sm font-medium mb-1">Sélectionnez ou créez un document</p>
              <p className="text-xs text-muted-foreground mb-4">
                {documents.length === 0
                  ? "Commencez par créer votre premier document."
                  : "Choisissez un document dans la liste."}
              </p>
              {documents.length === 0 && (
                <button onClick={createDoc}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium flex items-center gap-2 mx-auto">
                  <Plus size={14} /> Nouveau document
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
