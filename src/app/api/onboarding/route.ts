import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { APP_SESSION_COOKIE } from "@/lib/session";
import { defaultPurposeForDomain, learningGoalTitle, normalizeLearningDomain } from "@/lib/learning-goals";
import { saveProfile } from "@/lib/store";
import { LearnerProfile, LearningFocus, LearningPurpose, NativeLanguage, ProficiencyLevel, TargetLanguage } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, string>;
  let sessionId: string | null = null;

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    sessionId = user?.id ?? null;
  }

  sessionId =
    sessionId ??
    request.headers.get("x-openlearning-session-id") ??
    request.headers.get("cookie")?.match(new RegExp(`${APP_SESSION_COOKIE}=([^;]+)`))?.[1] ??
    "local-demo";

  const domain = normalizeLearningDomain(body.domain);
  const targetLanguage = (body.targetLanguage || "english") as TargetLanguage;
  const subject = body.subject?.trim();
  const purpose = (body.purpose || (domain === "language" ? body.focus : defaultPurposeForDomain(domain))) as LearningPurpose;
  const goalId = `goal-${domain}-${targetLanguage}-${(subject || "core").toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/gi, "-").replace(/^-|-$/g, "")}`;
  const profile: LearnerProfile = {
    activeGoalId: goalId,
    goals: [
      {
        id: goalId,
        domain,
        title: learningGoalTitle({ domain, targetLanguage, subject }),
        targetLanguage: domain === "language" ? targetLanguage : undefined,
        nativeLanguage: body.nativeLanguage as NativeLanguage,
        subject,
        level: body.level as ProficiencyLevel,
        purpose,
        dailyMinutes: Number(body.dailyMinutes),
        metadata: {
          gradeBand: body.gradeBand ?? "",
          examDate: body.examDate ?? "",
          targetScore: body.targetScore ?? "",
          outcome: body.outcome ?? "",
        },
        createdAt: new Date().toISOString(),
      },
    ],
    targetLanguage,
    nativeLanguage: body.nativeLanguage as NativeLanguage,
    level: body.level as ProficiencyLevel,
    dailyMinutes: Number(body.dailyMinutes),
    focus: body.focus as LearningFocus
  };

  await saveProfile(sessionId, profile);

  return NextResponse.json({ ok: true });
}
