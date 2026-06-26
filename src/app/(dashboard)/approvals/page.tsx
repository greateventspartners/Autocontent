"use client";

import React, { useState } from "react";
import { CheckCircle, XCircle, MessageSquare, ExternalLink, Link as LinkIcon, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const pendingPosts = [
  {
    id: 1,
    campaign: "Lancement Produit V2",
    platform: "LinkedIn",
    content: "Nous sommes fiers de vous annoncer la sortie de notre nouvelle fonctionnalité IA ! 🚀\n\nGrâce à notre équipe de recherche, gagnez jusqu'à 3h par jour sur votre création de contenu.\n\n#SaaS #Innovation #IA",
    image: "true",
    date: "Planifié pour le 12 Avril",
    status: "pending"
  },
  {
    id: 2,
    campaign: "Astuce de la semaine",
    platform: "Twitter",
    content: "L'erreur n°1 en marketing B2B ?\nOublier que vous parlez à des humains.\n\nSoyez authentique. Soyez clivant.\n\n(Thread complet ci-dessous 👇)",
    image: "false",
    date: "Planifié pour le 14 Avril",
    status: "pending"
  }
];

export default function ApprovalsPage() {
  const [posts, setPosts] = useState(pendingPosts);

  const handleAction = (id: number, action: "approve" | "reject") => {
    setPosts(posts.filter(p => p.id !== id));
    // Here we would typically update the DB
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <CheckCircle className="text-primary" size={28} />
            Approbations & Client
          </h2>
          <p className="text-muted-foreground mt-1">Validez les contenus avant publication ou générez un lien magique pour vos clients.</p>
        </div>
        <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm flex items-center gap-2 transition-colors">
          <LinkIcon size={16} /> Générer Lien Client
        </button>
      </div>

      <div className="flex gap-4 border-b border-white/10 pb-4">
        <button className="text-primary font-medium border-b-2 border-primary pb-4 -mb-4 px-2">En Attente ({posts.length})</button>
        <button className="text-muted-foreground hover:text-foreground font-medium pb-4 -mb-4 px-2 transition-colors">Approuvés (12)</button>
        <button className="text-muted-foreground hover:text-foreground font-medium pb-4 -mb-4 px-2 transition-colors">Rejetés (3)</button>
      </div>

      <div className="space-y-6">
        <AnimatePresence>
          {posts.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center text-center"
            >
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Tout est à jour !</h3>
              <p className="text-muted-foreground">Il n'y a plus aucun contenu en attente d'approbation pour ce workspace.</p>
            </motion.div>
          ) : (
            posts.map((post) => (
              <motion.div 
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="glass-card rounded-2xl overflow-hidden flex flex-col md:flex-row"
              >
                {/* Post Preview */}
                <div className="w-full md:w-2/3 p-6 border-b md:border-b-0 md:border-r border-white/10 bg-black/20">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded-md">
                      {post.platform}
                    </span>
                    <span className="text-xs text-muted-foreground">{post.date}</span>
                  </div>
                  
                  <div className="bg-white text-black p-5 rounded-xl shadow-xl max-w-lg mx-auto">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div>
                        <p className="font-bold text-sm">Autopilot App</p>
                        <p className="text-xs text-gray-500">Sponsorisé</p>
                      </div>
                    </div>
                    <p className="whitespace-pre-wrap text-sm mb-3">{post.content}</p>
                    {post.image === "true" && (
                      <div className="w-full h-40 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                        [Visuel Produit]
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions & Comments */}
                <div className="w-full md:w-1/3 p-6 flex flex-col bg-white/[0.02]">
                  <h4 className="font-bold text-lg mb-1">{post.campaign}</h4>
                  <p className="text-sm text-muted-foreground mb-6">Créé par IA Copilot</p>
                  
                  <div className="flex-1 flex flex-col gap-4">
                    <div className="bg-black/20 p-4 rounded-xl text-sm text-muted-foreground italic flex items-center gap-2 border border-white/5">
                      <MessageSquare size={16} />
                      Aucun commentaire pour le moment.
                    </div>
                    <button className="text-sm text-primary font-medium text-left hover:underline">
                      + Ajouter un commentaire
                    </button>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button 
                      onClick={() => handleAction(post.id, "reject")}
                      className="flex-1 py-2.5 bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2"
                    >
                      <XCircle size={18} /> Rejeter
                    </button>
                    <button 
                      onClick={() => handleAction(post.id, "approve")}
                      className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 rounded-xl font-medium text-sm transition-transform transform active:scale-95 flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={18} /> Approuver
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
