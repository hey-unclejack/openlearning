import { NextResponse } from "next/server";
import { APP_SESSION_COOKIE } from "@/lib/session";

const OAUTH_STATE_COOKIE = "openlearning_ai_oauth_state";

function resolveSessionId(request: Request) {
  return (
    request.headers.get("x-openlearning-session-id") ??
    request.headers.get("cookie")?.match(new RegExp(`${APP_SESSION_COOKIE}=([^;]+)`))?.[1] ??
    "local-demo"
  );
}

function oauthConfig(provider: string) {
  if (provider === "google") {
    return {
      clientId: process.env.GOOGLE_AI_OAUTH_CLIENT_ID,
      authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      scope: process.env.GOOGLE_AI_OAUTH_SCOPE ?? "https://www.googleapis.com/auth/generative-language",
    };
  }

  if (provider === "openai") {
    return {
      clientId: process.env.OPENAI_OAUTH_CLIENT_ID,
      authorizationUrl: process.env.OPENAI_OAUTH_AUTHORIZATION_URL,
      scope: process.env.OPENAI_OAUTH_SCOPE ?? "openid profile email",
    };
  }

  return null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const provider = url.searchParams.get("provider") === "openai" ? "openai" : "google";
  const config = oauthConfig(provider);

  if (!config?.clientId || !config.authorizationUrl) {
    return NextResponse.json(
      {
        ok: false,
        error:
          provider === "openai"
            ? "OpenAI API does not expose a standard user OAuth flow. Configure OPENAI_OAUTH_CLIENT_ID and OPENAI_OAUTH_AUTHORIZATION_URL only if you have a supported OpenAI OAuth app."
            : "Google OAuth is not configured. Set GOOGLE_AI_OAUTH_CLIENT_ID and GOOGLE_AI_OAUTH_CLIENT_SECRET.",
      },
      { status: 501 },
    );
  }

  const state = crypto.randomUUID();
  const callbackUrl = new URL("/api/ai/oauth/callback", url.origin);
  callbackUrl.searchParams.set("provider", provider);
  const authorizeUrl = new URL(config.authorizationUrl);
  authorizeUrl.searchParams.set("client_id", config.clientId);
  authorizeUrl.searchParams.set("redirect_uri", callbackUrl.toString());
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", config.scope);
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("access_type", "offline");
  authorizeUrl.searchParams.set("prompt", "consent");

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set(OAUTH_STATE_COOKIE, `${provider}:${resolveSessionId(request)}:${state}`, {
    httpOnly: true,
    maxAge: 600,
    path: "/",
    sameSite: "lax",
  });

  return response;
}
