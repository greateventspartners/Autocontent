import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "session";

const protectedPaths = ["/dashboard", "/copilot", "/calendar", "/brand-kit", "/approvals", "/bio", "/ideas", "/settings", "/documents", "/analytics", "/competitors"];
const authPaths = ["/", "/register", "/forgot-password"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(COOKIE_NAME);
  const onboardingDone = request.cookies.has("onboarding_done");

  if (protectedPaths.some((p) => pathname.startsWith(p)) && !hasSession) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (authPaths.includes(pathname) && hasSession) {
    const dest = onboardingDone ? "/dashboard" : "/onboarding";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  if (pathname === "/onboarding" && hasSession && onboardingDone) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
