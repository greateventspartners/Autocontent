import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PulseForge — Your brand. Autopiloted.",
  description: "Plateforme SaaS d'automatisation marketing IA qui planifie, rédige, conçoit, programme, publie et optimise des contenus multicanaux à partir de votre voix de marque.",
  keywords: ["marketing", "ia", "automatisation", "contenu", "blog", "reseaux sociaux", "calendrier editorial"],
  authors: [{ name: "PulseForge Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${outfit.variable} dark h-full antialiased`}
      style={{ colorScheme: "dark" }}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
