"use client";

import React, { useState, useCallback, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

export interface WizardStep {
  id: string;
  label: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  optional?: boolean;
}

interface WizardProps {
  steps: WizardStep[];
  onFinish: () => void | Promise<void>;
  finishLabel?: string;
  children: ReactNode[];
  canProceed?: (stepIndex: number) => boolean;
  className?: string;
}

export function Wizard({
  steps,
  onFinish,
  finishLabel = "Terminer",
  children,
  canProceed,
  className = "",
}: WizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const stepElements = React.Children.toArray(children);
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;
  const canGoNext = canProceed ? canProceed(currentStep) : true;

  const goNext = useCallback(() => {
    if (isLast) {
      onFinish();
      return;
    }
    setDirection(1);
    setCurrentStep((s) => s + 1);
  }, [isLast, onFinish]);

  const goPrev = useCallback(() => {
    if (isFirst) return;
    setDirection(-1);
    setCurrentStep((s) => s - 1);
  }, [isFirst]);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {steps.map((step, i) => {
          const isActive = i === currentStep;
          const isCompleted = i < currentStep;
          const Icon = step.icon;
          return (
            <React.Fragment key={step.id}>
              {i > 0 && (
                <div
                  className={`h-px w-8 transition-colors duration-300 ${
                    isCompleted ? "bg-primary" : "bg-white/10"
                  }`}
                />
              )}
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                      : isCompleted
                      ? "bg-primary/20 text-primary"
                      : "bg-white/5 text-muted-foreground border border-white/10"
                  }`}
                >
                  {isCompleted ? (
                    <Check size={16} />
                  ) : Icon ? (
                    <Icon size={16} />
                  ) : (
                    <span className="text-xs font-medium">{i + 1}</span>
                  )}
                </div>
                <span
                  className={`text-[11px] font-medium transition-colors duration-300 ${
                    isActive
                      ? "text-foreground"
                      : isCompleted
                      ? "text-primary/70"
                      : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -40 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {stepElements[currentStep]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t border-white/5 mt-6">
        <button
          onClick={goPrev}
          disabled={isFirst}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all disabled:opacity-0 disabled:pointer-events-none"
        >
          <ChevronLeft size={16} />
          Retour
        </button>

        <div className="flex items-center gap-2">
          {steps[currentStep].optional && (
            <button
              onClick={goNext}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
            >
              Passer
            </button>
          )}
          <button
            onClick={goNext}
            disabled={!canGoNext}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50 disabled:pointer-events-none ${
              isLast
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25"
                : "bg-white/10 text-foreground hover:bg-white/15 border border-white/10"
            }`}
          >
            {isLast ? finishLabel : "Suivant"}
            {!isLast && <ChevronRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
