import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import bcrypt from "bcryptjs";

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET est requis. Générez-en un avec: openssl rand -base64 32");
  }
  return new TextEncoder().encode(secret);
}

const COOKIE_NAME = "session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface SessionPayload extends JWTPayload {
  userId: string;
  email: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function parseCookies(header: string | null): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!header) return cookies;
  for (const pair of header.split(";")) {
    const [key, ...rest] = pair.split("=");
    if (key) cookies[key.trim()] = rest.join("=").trim();
  }
  return cookies;
}

function getTokenFromRequest(request: Request): string | null {
  const cookies = parseCookies(request.headers.get("cookie"));
  return cookies[COOKIE_NAME] ?? null;
}

export function createSessionCookie(token: string): string {
  const parts = [
    `${COOKIE_NAME}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${COOKIE_MAX_AGE}`,
  ];
  if (process.env.NODE_ENV === "production") {
    parts.push("Secure");
  }
  return parts.join("; ");
}

export async function createSession(userId: string, email: string) {
  const token = await new SignJWT({ userId, email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret());

  return { token, cookie: createSessionCookie(token) };
}

export async function getSession(request?: Request): Promise<SessionPayload | null> {
  let token: string | null = null;

  if (request) {
    token = getTokenFromRequest(request);
  } else {
    try {
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      token = cookieStore.get(COOKIE_NAME)?.value ?? null;
    } catch {
      return null;
    }
  }

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export async function clearSession() {
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
  } catch {
    // no-op on Cloudflare Workers
  }
}
