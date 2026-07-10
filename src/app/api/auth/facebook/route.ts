import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { getSession } from "@/lib/auth";
import { getFacebookAuthorizationUrl } from "@/lib/facebook";

export async function GET() {
  const session = await getSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const state = crypto.randomBytes(32).toString("hex");
  const authUrl = getFacebookAuthorizationUrl(state);

  const cookieStore = await cookies();
  cookieStore.set("facebook_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return NextResponse.redirect(authUrl);
}
