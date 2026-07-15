import { NextResponse } from "next/server";

export async function GET() {
  const envCheck = {
    DATABASE_URL: process.env.DATABASE_URL ? "SET (length=" + process.env.DATABASE_URL.length + ")" : "MISSING",
    GEMINI_API_KEY: process.env.GEMINI_API_KEY ? "SET" : "MISSING",
    JWT_SECRET: process.env.JWT_SECRET ? "SET" : "MISSING",
    NODE_ENV: process.env.NODE_ENV,
    runtime: "cloudflare-workers",
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(envCheck);
}
