"use client";

import { PlatformIcon, getChannelLabel } from "@/components/PlatformIcon";

interface PostPreviewProps {
  channel: string;
  title: string;
  content: string;
}

const CHANNEL_THEMES: Record<
  string,
  {
    bg: string;
    cardBg: string;
    text: string;
    muted: string;
    accent: string;
  }
> = {
  LINKEDIN: {
    bg: "#f4f2ee",
    cardBg: "#ffffff",
    text: "#191919",
    muted: "#666666",
    accent: "#0a66c2",
  },
  INSTAGRAM: {
    bg: "#fafafa",
    cardBg: "#ffffff",
    text: "#262626",
    muted: "#8e8e8e",
    accent: "#0095f6",
  },
  FACEBOOK: {
    bg: "#f0f2f5",
    cardBg: "#ffffff",
    text: "#1c1e21",
    muted: "#65676b",
    accent: "#1877f2",
  },
  X: {
    bg: "#000000",
    cardBg: "#000000",
    text: "#e7e9ea",
    muted: "#71767b",
    accent: "#1d9bf0",
  },
  PINTEREST: {
    bg: "#ffffff",
    cardBg: "#ffffff",
    text: "#211922",
    muted: "#767676",
    accent: "#e60023",
  },
  WORDPRESS: {
    bg: "#ffffff",
    cardBg: "#ffffff",
    text: "#1d2327",
    muted: "#646970",
    accent: "#21759b",
  },
};

function shortenText(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.substring(0, max - 3) + "...";
}

function Avatar({ accent, label = "P" }: { accent: string; label?: string }) {
  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: "50%",
        background: accent,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontSize: 16,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {label}
    </div>
  );
}

function PreviewLinkedIn({ title, content }: { title: string; content: string }) {
  const t = CHANNEL_THEMES.LINKEDIN;
  return (
    <div style={{ background: t.bg, padding: 16, borderRadius: 8 }}>
      <div
        style={{
          background: t.cardBg,
          borderRadius: 8,
          padding: 16,
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <Avatar accent={t.accent} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>PulseForge</div>
            <div style={{ fontSize: 11, color: t.muted }}>1h • &#x1f310;</div>
          </div>
        </div>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: t.text, margin: "0 0 8px" }}>{title}</h3>
        <p
          style={{
            fontSize: 13,
            color: t.text,
            lineHeight: 1.4,
            margin: 0,
            whiteSpace: "pre-wrap",
          }}
        >
          {shortenText(content, 300)}
        </p>
        <div
          style={{
            marginTop: 12,
            borderTop: `1px solid ${t.muted}33`,
            paddingTop: 8,
            display: "flex",
            gap: 12,
            fontSize: 12,
            color: t.muted,
          }}
        >
          <span>&#128077;</span>
          <span>&#128172;</span>
          <span>&#128257;</span>
        </div>
      </div>
    </div>
  );
}

function PreviewInstagram({ title, content }: { title: string; content: string }) {
  const t = CHANNEL_THEMES.INSTAGRAM;
  return (
    <div style={{ background: t.bg, padding: 0, borderRadius: 8, maxWidth: 320 }}>
      <div
        style={{
          background: t.cardBg,
          border: "1px solid #dbdbdb",
          borderRadius: 8,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px" }}>
          <Avatar accent="#e6683c" label="P" />
          <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>pulseforge</div>
        </div>
        <div
          style={{
            height: 200,
            background: "linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 13,
          }}
        >
          &#x1f5bc; Visual
        </div>
        <div style={{ padding: "8px 16px 12px" }}>
          <div style={{ display: "flex", gap: 12, fontSize: 22, marginBottom: 6 }}>
            <span>&#x2764;</span>
            <span>&#x1f4ac;</span>
            <span>&#x1f517;</span>
          </div>
          <p style={{ fontSize: 13, color: t.text, margin: 0, lineHeight: 1.4 }}>
            <strong style={{ fontWeight: 600 }}>pulseforge</strong>{" "}
            {shortenText(`${title} - ${content}`, 180)}
          </p>
        </div>
      </div>
    </div>
  );
}

function PreviewX({ title, content }: { title: string; content: string }) {
  const t = CHANNEL_THEMES.X;
  const full = `${title}\n\n${content}`.substring(0, 280);
  return (
    <div
      style={{
        background: t.bg,
        padding: 12,
        borderRadius: 8,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ display: "flex", gap: 10 }}>
        <Avatar accent={t.accent} />
        <div>
          <div style={{ display: "flex", gap: 4, fontSize: 13 }}>
            <span style={{ fontWeight: 700, color: t.text }}>PulseForge</span>
            <span style={{ color: t.muted }}>@pulseforge · 1h</span>
          </div>
          <p
            style={{
              fontSize: 13,
              color: t.text,
              margin: "4px 0",
              whiteSpace: "pre-wrap",
              lineHeight: 1.4,
            }}
          >
            {full}
          </p>
          <div style={{ display: "flex", gap: 20, fontSize: 13, color: t.muted, marginTop: 8 }}>
            <span>&#128172; {Math.floor(Math.random() * 20)}</span>
            <span>&#128257; {Math.floor(Math.random() * 50)}</span>
            <span>&#x2764; {Math.floor(Math.random() * 100)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewFacebook({ title, content }: { title: string; content: string }) {
  const t = CHANNEL_THEMES.FACEBOOK;
  return (
    <div
      style={{
        background: t.bg,
        padding: 12,
        borderRadius: 8,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          background: t.cardBg,
          borderRadius: 8,
          boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 12 }}>
          <Avatar accent={t.accent} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>PulseForge</div>
            <div style={{ fontSize: 11, color: t.muted }}>Hier à 14:00</div>
          </div>
        </div>
        <div style={{ padding: "0 12px 12px" }}>
          <p
            style={{
              fontSize: 13,
              color: t.text,
              margin: 0,
              lineHeight: 1.4,
              whiteSpace: "pre-wrap",
            }}
          >
            {shortenText(`${title}\n\n${content}`, 400)}
          </p>
        </div>
        <div
          style={{
            height: 140,
            background: `linear-gradient(90deg, ${t.accent}22, ${t.accent}44)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            color: t.muted,
            borderTop: "1px solid #ddd",
            borderBottom: "1px solid #ddd",
          }}
        >
          &#x1f4f7; Image ou lien
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-around",
            padding: "6px 12px",
            fontSize: 12,
            color: t.muted,
          }}
        >
          <span>&#128077; J&apos;aime</span>
          <span>&#128172; Commenter</span>
          <span>&#128257; Partager</span>
        </div>
      </div>
    </div>
  );
}

function PreviewPinterest({ title, content }: { title: string; content: string }) {
  const t = CHANNEL_THEMES.PINTEREST;
  return (
    <div style={{ background: t.bg, padding: 0, borderRadius: 12, maxWidth: 260, fontFamily: "system-ui, sans-serif", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>
      <div
        style={{
          aspectRatio: "2/3",
          background: `linear-gradient(135deg, #e60023, #bd081c, ${t.accent})`,
          borderRadius: "12px 12px 0 0",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: 16,
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", top: 12, right: 12, background: "#e60023", color: "#fff", fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 16 }}>
          Enregistrer
        </div>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: 0, textShadow: "0 1px 6px rgba(0,0,0,0.4)", lineHeight: 1.2 }}>
          {shortenText(title, 80)}
        </h3>
      </div>
      <div style={{ padding: 12 }}>
        <p style={{ fontSize: 12, color: t.text, margin: 0, lineHeight: 1.4, whiteSpace: "pre-wrap" }}>
          {shortenText(content, 200)}
        </p>
        <div style={{ display: "flex", gap: 8, marginTop: 8, fontSize: 10, color: t.muted }}>
          <span>#marketing</span>
          <span>#digital</span>
          <span>#growth</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, borderTop: `1px solid #efefef`, paddingTop: 10 }}>
          <div style={{ width: 20, height: 20, borderRadius: "50%", background: t.accent }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: t.text }}>PulseForge</span>
        </div>
      </div>
    </div>
  );
}

function PreviewWordPress({ title, content }: { title: string; content: string }) {
  const t = CHANNEL_THEMES.WORDPRESS;
  return (
    <div style={{ background: "#f0f0f1", padding: 16, borderRadius: 8, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ background: t.cardBg, borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
        <div style={{ height: 120, background: `linear-gradient(90deg, #21759b, #124964)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13 }}>
          &#x1f4f7; Image à la une
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 10, background: "#f0f0f1", color: t.muted, padding: "2px 8px", borderRadius: 4 }}>Marketing</span>
            <span style={{ fontSize: 10, background: "#f0f0f1", color: t.muted, padding: "2px 8px", borderRadius: 4 }}>Automatisation</span>
          </div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: t.text, margin: 0, lineHeight: 1.3 }}>{title}</h1>
          <p style={{ fontSize: 12, color: t.muted, margin: "6px 0 10px" }}>Publié le {new Date().toLocaleDateString("fr-FR")} par PulseForge</p>
          <p style={{ fontSize: 13, color: t.text, lineHeight: 1.5, margin: 0, whiteSpace: "pre-wrap" }}>
            {shortenText(content, 400)}
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 12, fontSize: 11, color: t.muted }}>
            <span>&#128172; {Math.floor(Math.random() * 10)} commentaires</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PostPreview({ channel, title, content }: PostPreviewProps) {
  const ch = channel?.toUpperCase() || "";
  const theme = CHANNEL_THEMES[ch];

  const previews: Record<string, React.ReactNode> = {
    LINKEDIN: <PreviewLinkedIn title={title} content={content} />,
    INSTAGRAM: <PreviewInstagram title={title} content={content} />,
    FACEBOOK: <PreviewFacebook title={title} content={content} />,
    X: <PreviewX title={title} content={content} />,
    PINTEREST: <PreviewPinterest title={title} content={content} />,
    WORDPRESS: <PreviewWordPress title={title} content={content} />,
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
        <PlatformIcon channel={channel} />
        <span className="font-semibold text-white uppercase tracking-wider">
          Aperçu {getChannelLabel(channel)}
        </span>
      </div>
      <div className="flex justify-center">
        <div className="w-full max-w-md">
          {previews[ch] || (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center text-xs text-zinc-500">
              <p className="font-semibold text-zinc-400 mb-1">{title}</p>
              <p className="whitespace-pre-wrap">{shortenText(content, 500)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
