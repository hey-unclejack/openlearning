import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { LOCALE_COOKIE, resolveLocale } from "@/lib/i18n";
import { APP_SESSION_COOKIE, APP_SESSION_HEADER } from "@/lib/session";

const protectedPrefixes = ["/dashboard", "/onboarding", "/progress", "/study"];
const authPages = ["/login", "/signup"];

export async function middleware(request: NextRequest) {
  const existingSessionId = request.cookies.get(APP_SESSION_COOKIE)?.value;
  const anonymousSessionId = existingSessionId ?? crypto.randomUUID();
  const existingLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  const preferredLocale = resolveLocale(existingLocale ?? request.headers.get("accept-language"));
  const requestHeaders = new Headers(request.headers);

  let response = NextResponse.next({
    request: {
      headers: requestHeaders
    }
  });

  let userId: string | null = null;

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value);
              response.cookies.set(name, value, options);
            });
          }
        }
      },
    );

    const {
      data: { user }
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  }

  const effectiveSessionId = userId ?? anonymousSessionId;
  requestHeaders.set(APP_SESSION_HEADER, effectiveSessionId);
  response = NextResponse.next({
    request: {
      headers: requestHeaders
    }
  });

  if (!existingSessionId) {
    response.cookies.set(APP_SESSION_COOKIE, anonymousSessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365
    });
  }

  if (!existingLocale) {
    response.cookies.set(LOCALE_COOKIE, preferredLocale, {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365
    });
  }

  const pathname = request.nextUrl.pathname;
  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
  const isAuthPage = authPages.includes(pathname);

  if (isProtected && !userId) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(redirectUrl);
  }

  if (isAuthPage && userId) {
    const next = request.nextUrl.searchParams.get("next");
    return NextResponse.redirect(new URL(next?.startsWith("/") ? next : "/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
