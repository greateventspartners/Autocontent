import { getYouTubeAuthorizationUrl } from "@/lib/youtube";
import { getSession } from "@/lib/auth";
import crypto from "crypto";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Non authentifié" }, { status: 401 });
  }

  const state = crypto.randomBytes(32).toString("hex");

  const authUrl = getYouTubeAuthorizationUrl(state);

  const redirectRes = Response.redirect(authUrl);

  redirectRes.headers.set(
    "Set-Cookie",
    `youtube_oauth_state=${state}; HttpOnly; SameSite=Lax; Path=/; Max-Age=600`
  );

  return redirectRes;
}
