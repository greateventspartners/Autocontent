import { isValidPlatform, generateOAuthState, setOAuthStateCookie, requireAuth } from "@/lib/oauth";
import { getAuthorizationUrl as getLinkedInAuthUrl } from "@/lib/linkedin";
import { getFacebookAuthorizationUrl } from "@/lib/facebook";
import { getTikTokAuthorizationUrl } from "@/lib/tiktok";
import { getPinterestAuthorizationUrl } from "@/lib/pinterest";
import { getYouTubeAuthorizationUrl } from "@/lib/youtube";
import { getWordPressAuthorizationUrl } from "@/lib/wordpress";
import { getMediumAuthorizationUrl } from "@/lib/medium";

const authUrlBuilders: Record<string, (state: string) => string> = {
  linkedin: getLinkedInAuthUrl,
  facebook: getFacebookAuthorizationUrl,
  tiktok: getTikTokAuthorizationUrl,
  pinterest: getPinterestAuthorizationUrl,
  youtube: getYouTubeAuthorizationUrl,
  wordpress: getWordPressAuthorizationUrl,
  medium: getMediumAuthorizationUrl,
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;

  if (!isValidPlatform(platform)) {
    return Response.json({ error: "Plateforme inconnue" }, { status: 400 });
  }

  const { error, session } = await requireAuth();
  if (error) {
    return Response.json({ error }, { status: 401 });
  }

  const buildAuthUrl = authUrlBuilders[platform];
  if (!buildAuthUrl) {
    return Response.json({ error: "OAuth non supporté" }, { status: 400 });
  }

  const state = generateOAuthState();
  const authUrl = buildAuthUrl(state);

  const res = Response.redirect(authUrl);
  res.headers.set("Set-Cookie", setOAuthStateCookie(platform, state));

  return res;
}
