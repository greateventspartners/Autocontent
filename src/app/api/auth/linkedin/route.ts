import { getAuthorizationUrl } from "@/lib/linkedin";
import { getSession } from "@/lib/auth";
import crypto from "crypto";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  const state = crypto.randomBytes(32).toString("hex");

  const authUrl = getAuthorizationUrl(state);

  const redirectRes = Response.redirect(authUrl);

  redirectRes.headers.set(
    "Set-Cookie",
    `linkedin_oauth_state=${state}; HttpOnly; SameSite=Lax; Path=/; Max-Age=600`
  );

  return redirectRes;
}
