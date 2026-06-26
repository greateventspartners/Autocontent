"use client";

import React, { useState } from "react";
import { Sparkles, Image as ImageIcon, Link as LinkIcon, Send, Share2, MessageCircle, Camera } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CopilotPage() {
  const [activeTab, setActiveTab] = useState("linkedin");
  const [prompt, setPrompt] = useState("");

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6">
      
      {/* LEFT: Input Area */}
      <div className="w-full md:w-1/3 flex flex-col gap-4">
        <div className="glass-card rounded-2xl p-6 flex-1 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
          
          <h2 className="text-xl font-bold flex items-center gap-2 mb-6 relative z-10">
            <Sparkles className="text-primary" size={20} />
            Copilot IA
          </h2>
          
          <div className="flex-1 flex flex-col gap-4 relative z-10">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Source ou Sujet</label>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex: Rédige un post sur notre nouvelle fonctionnalité IA, en insistant sur le gain de temps. Utilise notre ton 'Corporate'." 
                className="w-full h-40 p-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            </div>
            
            <div className="flex gap-2">
              <button className="flex-1 py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors">
                <LinkIcon size={16} /> URL
              </button>
              <button className="flex-1 py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors">
                <ImageIcon size={16} /> Image
              </button>
            </div>
            
            <div className="mt-auto">
              <button className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/25 font-bold flex items-center justify-center gap-2 transition-transform transform active:scale-95">
                <Send size={18} />
                Générer les variations
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: WYSIWYG Previews */}
      <div className="w-full md:w-2/3 glass-card rounded-2xl flex flex-col overflow-hidden relative">
        <div className="flex items-center gap-2 p-4 border-b border-white/10 bg-white/[0.02]">
          <button 
            onClick={() => setActiveTab("linkedin")}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${activeTab === 'linkedin' ? 'bg-blue-600 text-white' : 'text-muted-foreground hover:bg-white/5'}`}
          >
            <Share2 size={16} /> LinkedIn
          </button>
          <button 
            onClick={() => setActiveTab("twitter")}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${activeTab === 'twitter' ? 'bg-sky-500 text-white' : 'text-muted-foreground hover:bg-white/5'}`}
          >
            <MessageCircle size={16} /> Twitter (X)
          </button>
          <button 
            onClick={() => setActiveTab("instagram")}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${activeTab === 'instagram' ? 'bg-gradient-to-tr from-pink-500 to-orange-400 text-white' : 'text-muted-foreground hover:bg-white/5'}`}
          >
            <Camera size={16} /> Instagram
          </button>
        </div>
        
        <div className="flex-1 p-8 bg-black/20 overflow-y-auto flex justify-center items-start">
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md bg-white rounded-xl text-black shadow-2xl overflow-hidden"
            >
              {/* Mocking platform UI */}
              <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                <div>
                  <p className="font-bold text-sm">Autopilot App</p>
                  <p className="text-xs text-gray-500">{activeTab === 'linkedin' ? '24,534 abonnés' : '@autopilot_app'}</p>
                </div>
              </div>
              <div className="p-4 whitespace-pre-wrap text-sm">
                {prompt ? (
                  <>
                    🚀 Nouvelle génération détectée...
                    <br/><br/>
                    {activeTab === 'linkedin' && "Voici un post détaillé, professionnel et impactant généré à partir de votre texte. Idéal pour votre réseau professionnel."}
                    {activeTab === 'twitter' && "Un thread percutant en 280 caractères max ! 🔥 #SaaS #IA"}
                    {activeTab === 'instagram' && "Une légende esthétique avec plein d'emojis pour accompagner votre carrousel. ✨📸"}
                  </>
                ) : (
                  <span className="text-gray-400 italic">Entrez un prompt à gauche pour générer un aperçu...</span>
                )}
              </div>
              {prompt && (
                <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400">
                  [Espace Média]
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
}
