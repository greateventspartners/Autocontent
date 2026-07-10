import { getPinterestAuthorizationUrl } from "@/lib/pinterest";
import { getSession } from "@/lib/auth";
import crypto from "crypto";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  const state = crypto.randomBytes(32).toString("hex");

  const authUrl = getPinterestAuthorizationUrl(state);

  const redirectRes = Response.redirect(authUrl);

  redirectRes.headers.set(
    "Set-Cookie",
    `pinterest_oauth_state=${state}; HttpOnly; SameSite=Lax; Path=/; Max-Age=600`
  );

  return redirectRes;
}
