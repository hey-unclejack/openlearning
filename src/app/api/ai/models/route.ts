import { NextResponse } from "next/server";
import { decryptCredential } from "@/lib/ai/credentials";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { APP_SESSION_COOKIE } from "@/lib/session";
import { getAiProviderConnection } from "@/lib/store";
import { AIProviderConnection } from "@/lib/types";

type ModelOption = {
  id: string;
  name: string;
};

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

function resolveProvider(value: string | null | undefined): AIProviderConnection["provider"] {
  return value === "openrouter" || value === "google" ? value : "openai";
}

async function resolveCredential(request: Request, provider: AIProviderConnection["provider"], apiKey?: string) {
  if (apiKey?.trim()) {
    return apiKey.trim();
  }

  const sessionId = await resolveSessionId(request);
  const connection = await getAiProviderConnection(sessionId, provider);
  return decryptCredential(connection?.encryptedCredential);
}

async function listOpenAiModels(apiKey: string): Promise<ModelOption[]> {
  const response = await fetch("https://api.openai.com/v1/models", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!response.ok) {
    throw new Error("Failed to load OpenAI models.");
  }

  const payload = await response.json() as { data?: Array<{ id: string }> };
  return (payload.data ?? [])
    .map((model) => ({ id: model.id, name: model.id }))
    .filter((model) => model.id.startsWith("gpt-") || model.id.startsWith("o"))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function listOpenRouterModels(): Promise<ModelOption[]> {
  const response = await fetch("https://openrouter.ai/api/v1/models?output_modalities=text", {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error("Failed to load OpenRouter models.");
  }

  const payload = await response.json() as { data?: Array<{ id: string; name?: string }> };
  return (payload.data ?? [])
    .map((model) => ({ id: model.id, name: model.name ?? model.id }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function listGeminiModels(apiKey?: string): Promise<ModelOption[]> {
  const suffix = apiKey ? `?key=${encodeURIComponent(apiKey)}` : "";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models${suffix}`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error("Failed to load Gemini models.");
  }

  const payload = await response.json() as { models?: Array<{ name: string; displayName?: string; supportedGenerationMethods?: string[] }> };
  return (payload.models ?? [])
    .filter((model) => model.supportedGenerationMethods?.includes("generateContent"))
    .map((model) => ({
      id: model.name.replace(/^models\//, ""),
      name: model.displayName ? `${model.displayName} (${model.name.replace(/^models\//, "")})` : model.name.replace(/^models\//, ""),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    provider?: AIProviderConnection["provider"];
    apiKey?: string;
  };
  const provider = resolveProvider(body.provider);

  try {
    if (provider === "openrouter") {
      return NextResponse.json({ ok: true, models: await listOpenRouterModels() });
    }

    const credential = await resolveCredential(request, provider, body.apiKey);

    if (!credential && provider === "openai") {
      return NextResponse.json({ ok: false, error: "API key is required to load OpenAI models." }, { status: 400 });
    }

    const models = provider === "google" ? await listGeminiModels(credential ?? undefined) : await listOpenAiModels(credential!);
    return NextResponse.json({ ok: true, models });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to load models." },
      { status: 400 },
    );
  }
}
