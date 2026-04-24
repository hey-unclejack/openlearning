import { AppShell } from "@/components/layout/app-shell";
import { AiBusinessSnapshot } from "@/components/ai/ai-business-snapshot";
import { AiLearningForm } from "@/components/ai/ai-learning-form";
import { AdSlot } from "@/components/monetization/ad-slot";
import { getLocale } from "@/lib/i18n-server";
import { getActiveLearningGoal } from "@/lib/learning-goals";
import { getCurrentUser, getSessionIdFromHeaders } from "@/lib/session";
import { getAiBusinessSnapshot, getAiUsageSummary, readState } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AiLearningPage({
  searchParams,
}: {
  searchParams: Promise<{ progressMode?: string; replaceFromDayNumber?: string }>;
}) {
  const [locale, user, sessionId] = await Promise.all([getLocale(), getCurrentUser(), getSessionIdFromHeaders()]);
  const params = await searchParams;
  const [state, usageSummary, businessSnapshot] = await Promise.all([
    readState(sessionId),
    getAiUsageSummary(sessionId),
    getAiBusinessSnapshot(sessionId),
  ]);
  const isZh = locale === "zh-TW";
  const activeGoal = state.profile ? getActiveLearningGoal(state.profile) : undefined;

  return (
    <AppShell activePath="/ai" locale={locale} userEmail={user?.email}>
      <section className="stack ai-page">
        <div className="panel-header">
          <div>
            <div className="eyebrow">{isZh ? "AI 學習導入" : "AI Learning Intake"}</div>
            <h1 className="page-title">{isZh ? "用自己的內容產生學習計劃。" : "Generate a plan from your own content."}</h1>
            <p className="subtle">
              {isZh
                ? "語言仍是預設主軸，也可以把數學、國文閱讀或自己的內容轉成短課、練習與 SRS。成人/家長帳號負責付費與 AI 連接。"
                : "Language remains the default, and math, Mandarin literacy, or your own content can become short lessons, practice, and SRS. Adult or parent accounts control billing and AI connections."}
            </p>
          </div>
        </div>
        <AiBusinessSnapshot locale={locale} snapshot={businessSnapshot} />
        <AiLearningForm
          activeGoal={activeGoal}
          initialPlans={state.generatedPlans.filter((plan) => plan.status === "active")}
          locale={locale}
          progressMode={params.progressMode === "replace-fixed" ? "replace-fixed" : params.progressMode === "append" ? "append" : undefined}
          replaceFromDayNumber={params.replaceFromDayNumber ? Number(params.replaceFromDayNumber) : undefined}
          usageSummary={usageSummary}
        />
        <AdSlot childMode={state.learningSources.some((source) => source.childMode)} locale={locale} />
      </section>
    </AppShell>
  );
}
