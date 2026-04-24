import { NextResponse } from "next/server";
import { generateLearningPlan, validateGeneratedDays } from "@/lib/ai/generation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { APP_SESSION_COOKIE } from "@/lib/session";
import { deleteGeneratedLearningPlan, readState, saveGeneratedLearningPlan } from "@/lib/store";
import { AIProviderMode, AIUsageLog, GeneratedLearningPlan, LearningDomain, LearningSource, LearningSourceType, SubjectArea, TargetLanguage } from "@/lib/types";

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

export async function POST(request: Request) {
  const body = (await request.json()) as {
    sourceType?: LearningSourceType;
    domain?: LearningDomain;
    subject?: SubjectArea;
    targetLanguage?: TargetLanguage;
    title?: string;
    rawText?: string;
    sourceUrl?: string;
    userOwnsRights?: boolean;
    childMode?: boolean;
    providerMode?: AIProviderMode;
    dayCount?: number;
    previewOnly?: boolean;
    action?: "commit";
    source?: LearningSource;
    plan?: GeneratedLearningPlan;
    usageLog?: AIUsageLog;
  };

  const sessionId = await resolveSessionId(request);
  const state = await readState(sessionId);

  if (body.action === "commit") {
    if (!body.source || !body.plan || !body.usageLog) {
      return NextResponse.json({ ok: false, error: "source, plan, and usageLog are required." }, { status: 400 });
    }

    if (body.plan.sourceId !== body.source.id) {
      return NextResponse.json({ ok: false, error: "Generated plan source does not match." }, { status: 400 });
    }

    if (!body.source.userOwnsRights) {
      return NextResponse.json({ ok: false, error: "請先確認你有權使用這份內容。" }, { status: 400 });
    }

    const quality = validateGeneratedDays(body.plan.days, body.source, body.plan.days.length);

    if (!quality.valid) {
      return NextResponse.json({ ok: false, error: quality.warnings.join(" ") }, { status: 400 });
    }

    const plan: GeneratedLearningPlan = {
      ...body.plan,
      status: "active",
      qualityWarnings: [...new Set([...body.plan.qualityWarnings, ...quality.warnings])],
    };
    const usageLog: AIUsageLog = {
      ...body.usageLog,
      sourceId: body.source.id,
      generatedPlanId: plan.id,
    };

    await saveGeneratedLearningPlan(sessionId, { source: body.source, plan, usageLog });

    return NextResponse.json({ ok: true, source: body.source, plan, usageLog });
  }

  if (!state.aiSettings.enabled) {
    return NextResponse.json({ ok: false, error: "請先到 AI 設定啟用 AI 服務。" }, { status: 403 });
  }

  if (!state.aiSettings.permissions.generate_courses) {
    return NextResponse.json({ ok: false, error: "請先到 AI 設定開啟「生成課程」權限。" }, { status: 403 });
  }

  const result = await generateLearningPlan({
    sessionId,
    sourceType: body.sourceType ?? "topic",
    domain: body.domain,
    subject: body.subject ?? "language",
    targetLanguage: body.targetLanguage,
    title: body.title ?? "",
    rawText: body.rawText ?? body.title ?? "",
    sourceUrl: body.sourceUrl,
    userOwnsRights: body.userOwnsRights === true,
    childMode: body.childMode === true,
    providerMode: body.providerMode ?? "official",
    dayCount: body.dayCount,
    planStatus: body.previewOnly ? "draft" : "active",
  });

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}

export async function DELETE(request: Request) {
  const sessionId = await resolveSessionId(request);
  const url = new URL(request.url);
  const planId = url.searchParams.get("planId");

  if (!planId) {
    return NextResponse.json({ ok: false, error: "planId is required." }, { status: 400 });
  }

  const deleted = await deleteGeneratedLearningPlan(sessionId, planId);

  if (!deleted) {
    return NextResponse.json({ ok: false, error: "Generated plan was not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
