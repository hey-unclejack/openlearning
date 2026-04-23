import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { LOCALE_COOKIE, USER_LOCALE_METADATA_KEY, resolveLocale } from "@/lib/i18n";
import { APP_SESSION_COOKIE, APP_SESSION_HEADER } from "@/lib/session";

const protectedPrefixes = ["/dashboard", "/profile", "/onboarding", "/progress", "/study"];
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
  let userLocale: string | null = null;

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
    userLocale =
      typeof user?.user_metadata?.[USER_LOCALE_METADATA_KEY] === "string"
        ? resolveLocale(user.user_metadata[USER_LOCALE_METADATA_KEY] as string)
        : null;
  }

  const effectiveSessionId = userId ?? anonymousSessionId;
  requestHeaders.set(APP_SESSION_HEADER, effectiveSessionId);

  const forwardedCookies = response.cookies.getAll();
  response = NextResponse.next({
    request: {
      headers: requestHeaders
    }
  });
  forwardedCookies.forEach((cookie) => {
    response.cookies.set(cookie);
  });

  if (!existingSessionId || existingSessionId !== effectiveSessionId) {
    response.cookies.set(APP_SESSION_COOKIE, effectiveSessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365
    });
  }

  const effectiveLocale = userLocale ?? preferredLocale;

  if (!existingLocale || existingLocale !== effectiveLocale) {
    response.cookies.set(LOCALE_COOKIE, effectiveLocale, {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365
    });
  }

  const authCode = request.nextUrl.searchParams.get("code");

  if (authCode && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
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

    await supabase.auth.exchangeCodeForSession(authCode);
    const {
      data: { user }
    } = await supabase.auth.getUser();
    const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
    const existingUserLocale = user?.user_metadata?.[USER_LOCALE_METADATA_KEY];

    if (user && !existingUserLocale && cookieLocale) {
      await supabase.auth.updateUser({
        data: {
          [USER_LOCALE_METADATA_KEY]: resolveLocale(cookieLocale)
        }
      });
    }

    const redirectUrl = request.nextUrl.clone();
    const nextFromQuery = redirectUrl.searchParams.get("next");
    redirectUrl.pathname = nextFromQuery?.startsWith("/") ? nextFromQuery : redirectUrl.pathname;
    redirectUrl.searchParams.delete("code");
    redirectUrl.searchParams.delete("next");
    redirectUrl.searchParams.delete("state");

    const redirectResponse = NextResponse.redirect(redirectUrl);
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  }

  const pathname = request.nextUrl.pathname;
  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
  const isAuthPage = authPages.includes(pathname);

  if (isProtected && !userId) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  }

  if (isAuthPage && userId) {
    const next = request.nextUrl.searchParams.get("next");
    const redirectResponse = NextResponse.redirect(new URL(next?.startsWith("/") ? next : "/dashboard", request.url));
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
