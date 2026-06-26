"use client";

import React from "react";
import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="relative p-2 text-muted-foreground hover:bg-white/5 rounded-full transition-colors group"
      aria-label="Basculer le thème"
    >
      <motion.div
        key={theme}
        initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {theme === "dark" ? (
          <Sun size={20} className="group-hover:text-foreground transition-colors" />
        ) : (
          <Moon size={20} className="group-hover:text-foreground transition-colors" />
        )}
      </motion.div>
    </button>
  );
}
