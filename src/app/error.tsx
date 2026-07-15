"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ padding: 40, fontFamily: "monospace", background: "#111", color: "#f44", minHeight: "100vh" }}>
      <h1>500 - Server Error</h1>
      <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        {error?.message || "No message"}
      </pre>
      {error?.digest && <pre>Digest: {error.digest}</pre>}
      {error?.stack && (
        <pre style={{ fontSize: 12, marginTop: 20, color: "#888" }}>
          {error.stack}
        </pre>
      )}
      <button onClick={reset} style={{ marginTop: 20, padding: "8px 16px", background: "#333", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>
        Try Again
      </button>
    </div>
  );
}
