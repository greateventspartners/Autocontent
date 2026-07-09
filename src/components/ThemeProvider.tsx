"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

type ThemeState = {
  theme: Theme;
  mounted: boolean;
};

const ThemeContext = createContext({
  theme: "dark" as Theme,
  toggle: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [{ theme, mounted }, setState] = useState<ThemeState>({
    theme: "dark",
    mounted: false,
  });

  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    const preferred = stored || "dark";
    document.documentElement.classList.toggle("dark", preferred === "dark");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ theme: preferred, mounted: true });
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
    setState({ theme: next, mounted: true });
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
