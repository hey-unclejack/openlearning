import { NextResponse } from "next/server";
import { decryptCredential, encryptCredential, maskCredential } from "@/lib/ai/credentials";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { APP_SESSION_COOKIE } from "@/lib/session";
import { deleteAiProviderConnection, getAiProviderConnection, saveAiProviderConnection } from "@/lib/store";
import { AIProviderConnection } from "@/lib/types";

async function resolveSessionId(request: Request) {
  let sessionId: string | null = null;

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    sessionId = user?.id ?? null;
  }

  return (
    sessionId ??
    request.headers.get("x-openlearning-session-id") ??
    request.headers.get("cookie")?.match(new RegExp(`${APP_SESSION_COOKIE}=([^;]+)`))?.[1] ??
    "local-demo"
  );
}

function serializeConnection(connection?: AIProviderConnection | null) {
  return connection
    ? {
        provider: connection.provider,
        mode: connection.mode,
        status: connection.status,
        maskedCredential: connection.maskedCredential,
        model: connection.model,
        updatedAt: connection.updatedAt,
      }
    : null;
}

function resolveProvider(value: string | null | undefined): AIProviderConnection["provider"] {
  return value === "openrouter" || value === "google" || value === "anthropic" || value === "other" ? value : "openai";
}

async function testProviderCredential(provider: AIProviderConnection["provider"], apiKey: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  const url = provider === "openrouter" ? "https://openrouter.ai/api/v1/models" : "https://api.openai.com/v1/models";
  const label = provider === "openrouter" ? "OpenRouter" : "OpenAI";

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
    });

    if (response.ok) {
      return { ok: true as const };
    }

    if (response.status === 401 || response.status === 403) {
      return { ok: false as const, error: `${label} rejected this API key.` };
    }

    return { ok: false as const, error: `${label} connection test failed. Try again later.` };
  } catch {
    return { ok: false as const, error: `${label} connection test timed out or failed.` };
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request: Request) {
  const sessionId = await resolveSessionId(request);
  const url = new URL(request.url);
  const connection = await getAiProviderConnection(sessionId, resolveProvider(url.searchParams.get("provider")));

  return NextResponse.json({
    ok: true,
    connection: serializeConnection(connection),
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    provider?: AIProviderConnection["provider"];
    apiKey?: string;
    model?: string;
  };
  const apiKey = body.apiKey?.trim();

  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "API key is required." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const sessionId = await resolveSessionId(request);
  const connection: AIProviderConnection = {
    id: `connection-${Date.now().toString(36)}`,
    provider: resolveProvider(body.provider),
    mode: "byok",
    status: "configured",
    maskedCredential: maskCredential(apiKey),
    encryptedCredential: encryptCredential(apiKey),
    model: body.model?.trim() || "gpt-4.1-mini",
    createdAt: now,
    updatedAt: now,
  };

  await saveAiProviderConnection(sessionId, connection);

  return NextResponse.json({
    ok: true,
    connection: serializeConnection(connection),
  });
}

export async function PATCH(request: Request) {
  const sessionId = await resolveSessionId(request);
  const url = new URL(request.url);
  const provider = resolveProvider(url.searchParams.get("provider"));
  const connection = await getAiProviderConnection(sessionId, provider);
  const apiKey = decryptCredential(connection?.encryptedCredential);

  if (!connection || !apiKey) {
    return NextResponse.json({ ok: false, error: `No configured ${provider} API key found.` }, { status: 404 });
  }

  const testResult = await testProviderCredential(provider, apiKey);
  const now = new Date().toISOString();
  const updated: AIProviderConnection = {
    ...connection,
    status: testResult.ok ? "configured" : "needs_attention",
    updatedAt: now,
  };

  await saveAiProviderConnection(sessionId, updated);

  return NextResponse.json({
    ok: testResult.ok,
    error: testResult.ok ? undefined : testResult.error,
    connection: serializeConnection(updated),
  }, { status: testResult.ok ? 200 : 400 });
}

export async function DELETE(request: Request) {
  const sessionId = await resolveSessionId(request);
  const url = new URL(request.url);
  await deleteAiProviderConnection(sessionId, resolveProvider(url.searchParams.get("provider")));

  return NextResponse.json({ ok: true });
}
