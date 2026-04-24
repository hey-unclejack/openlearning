import { NextResponse } from "next/server";
import { encryptCredential, maskCredential } from "@/lib/ai/credentials";
import { APP_SESSION_COOKIE } from "@/lib/session";
import { saveAiProviderConnection } from "@/lib/store";
import { AIProviderConnection } from "@/lib/types";

const OAUTH_STATE_COOKIE = "openlearning_ai_oauth_state";

function resolveSessionId(request: Request) {
  return (
    request.headers.get("x-openlearning-session-id") ??
    request.headers.get("cookie")?.match(new RegExp(`${APP_SESSION_COOKIE}=([^;]+)`))?.[1] ??
    "local-demo"
  );
}

function oauthConfig(provider: AIProviderConnection["provider"]) {
  if (provider === "google") {
    return {
      clientId: process.env.GOOGLE_AI_OAUTH_CLIENT_ID,
      clientSecret: process.env.GOOGLE_AI_OAUTH_CLIENT_SECRET,
      tokenUrl: "https://oauth2.googleapis.com/token",
      model: "gemini-2.5-flash",
    };
  }

  if (provider === "openai") {
    return {
      clientId: process.env.OPENAI_OAUTH_CLIENT_ID,
      clientSecret: process.env.OPENAI_OAUTH_CLIENT_SECRET,
      tokenUrl: process.env.OPENAI_OAUTH_TOKEN_URL,
      model: "gpt-4.1-mini",
    };
  }

  return null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const provider = url.searchParams.get("provider") === "openai" ? "openai" : "google";
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = request.headers.get("cookie")?.match(new RegExp(`${OAUTH_STATE_COOKIE}=([^;]+)`))?.[1];
  const sessionId = resolveSessionId(request);
  const expectedState = cookieState ? decodeURIComponent(cookieState) : "";
  const config = oauthConfig(provider);
  const redirectToSettings = new URL("/profile/ai-settings", url.origin);

  if (!code || !state || expectedState !== `${provider}:${sessionId}:${state}` || !config?.clientId || !config.clientSecret || !config.tokenUrl) {
    redirectToSettings.searchParams.set("oauth", "failed");
    const response = NextResponse.redirect(redirectToSettings);
    response.cookies.delete(OAUTH_STATE_COOKIE);
    return response;
  }

  const callbackUrl = new URL("/api/ai/oauth/callback", url.origin);
  callbackUrl.searchParams.set("provider", provider);
  const tokenResponse = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: callbackUrl.toString(),
    }),
  });

  if (!tokenResponse.ok) {
    redirectToSettings.searchParams.set("oauth", "failed");
    const response = NextResponse.redirect(redirectToSettings);
    response.cookies.delete(OAUTH_STATE_COOKIE);
    return response;
  }

  const payload = await tokenResponse.json() as { access_token?: string; refresh_token?: string };
  const credential = payload.refresh_token ?? payload.access_token;

  if (!credential) {
    redirectToSettings.searchParams.set("oauth", "failed");
    const response = NextResponse.redirect(redirectToSettings);
    response.cookies.delete(OAUTH_STATE_COOKIE);
    return response;
  }

  const now = new Date().toISOString();
  await saveAiProviderConnection(sessionId, {
    id: `oauth-${provider}-${Date.now().toString(36)}`,
    provider,
    mode: "oauth",
    status: "configured",
    maskedCredential: maskCredential(credential),
    encryptedCredential: encryptCredential(credential),
    model: config.model,
    createdAt: now,
    updatedAt: now,
  });

  redirectToSettings.searchParams.set("oauth", "connected");
  const response = NextResponse.redirect(redirectToSettings);
  response.cookies.delete(OAUTH_STATE_COOKIE);
  return response;
}
