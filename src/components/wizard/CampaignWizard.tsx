"use client";

import React, { useState } from "react";
import { Wizard, type WizardStep } from "@/components/wizard/Wizard";
import {
  FolderPlus, Palette, FileText, Rocket, Check,
} from "lucide-react";
import { motion } from "framer-motion";

const STEPS: WizardStep[] = [
  { id: "info", label: "Informations", icon: FileText },
  { id: "color", label: "Couleur", icon: Palette },
  { id: "confirm", label: "Confirmer", icon: Rocket },
];

const COLORS = [
  "#6366f1", "#10b981", "#f59e0b", "#ef4444",
  "#3b82f6", "#ec4899", "#06b6d4", "#8b5cf6",
];

interface CampaignWizardProps {
  onComplete: (data: { title: string; description: string; colorCode: string }) => void;
  onSkip: () => void;
}

export default function CampaignWizard({ onComplete, onSkip }: CampaignWizardProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  const canProceed = (step: number) => {
    if (step === 0) return title.trim().length > 0;
    return true;
  };

  return (
    <div className="max-w-lg mx-auto">
      <Wizard
        steps={STEPS}
        onFinish={() => onComplete({ title, description, colorCode: color })}
        finishLabel="Créer la campagne"
        canProceed={canProceed}
      >
        {/* Step 1: Info */}
        <div className="space-y-4">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <FolderPlus size={24} className="text-primary" />
            </div>
            <h3 className="text-lg font-bold">Nouvelle campagne</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Regroupez vos contenus par thème, événement ou objectif.
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Titre *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Lancement produit Q3, Événement Tech..."
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Objectifs, cibles, durée..."
              className="w-full h-24 px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none placeholder:text-muted-foreground/50"
            />
          </div>
        </div>

        {/* Step 2: Color */}
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h3 className="text-lg font-bold">Choisissez une couleur</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Cette couleur identifie visuellement votre campagne.
            </p>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`aspect-square rounded-xl transition-all flex items-center justify-center ${
                  color === c
                    ? "ring-2 ring-offset-2 ring-offset-background scale-110"
                    : "hover:scale-105"
                }`}
                style={{
                  backgroundColor: c,
                  ["--tw-ring-color" as string]: c,
                }}
              >
                {color === c && <Check size={20} className="text-white" />}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 p-4 bg-white/[0.02] rounded-xl border border-white/5">
            <div className="w-10 h-10 rounded-xl" style={{ backgroundColor: color }} />
            <div>
              <p className="text-sm font-medium">Aperçu</p>
              <p className="text-[11px] text-muted-foreground">{title || "Ma campagne"}</p>
            </div>
          </div>
        </div>

        {/* Step 3: Confirm */}
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h3 className="text-lg font-bold">Prêt à créer</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Vérifiez les informations de votre campagne.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl shrink-0" style={{ backgroundColor: color }} />
              <div>
                <p className="font-bold">{title}</p>
                {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
              </div>
            </div>
          </div>
        </div>
      </Wizard>

      <div className="text-center mt-6">
        <button
          onClick={onSkip}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Passer et créer directement
        </button>
      </div>
    </div>
  );
}
