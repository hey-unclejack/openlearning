import { AppShell } from "@/components/layout/app-shell";
import { AiBusinessSnapshot } from "@/components/ai/ai-business-snapshot";
import { AiLearningForm } from "@/components/ai/ai-learning-form";
import { AdSlot } from "@/components/monetization/ad-slot";
import { getLocale } from "@/lib/i18n-server";
import { getCurrentUser, getSessionIdFromHeaders } from "@/lib/session";
import { getAiBusinessSnapshot, getAiUsageSummary, readState } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AiLearningPage() {
  const [locale, user, sessionId] = await Promise.all([getLocale(), getCurrentUser(), getSessionIdFromHeaders()]);
  const [state, usageSummary, businessSnapshot] = await Promise.all([
    readState(sessionId),
    getAiUsageSummary(sessionId),
    getAiBusinessSnapshot(sessionId),
  ]);
  const isZh = locale === "zh-TW";

  return (
    <AppShell activePath="/ai" locale={locale} userEmail={user?.email}>
      <section className="stack ai-page">
        <div className="panel-header">
          <div>
            <div className="eyebrow">{isZh ? "AI 學習導入" : "AI Learning Intake"}</div>
            <h1 className="page-title">{isZh ? "用自己的內容產生學習計劃。" : "Generate a plan from your own content."}</h1>
            <p className="subtle">
              {isZh
                ? "先支援語言 MVP，同一套結構可延伸到數學、國文等科目。成人/家長帳號負責付費與 AI 連接。"
                : "The MVP starts with language learning and keeps the structure ready for math and Mandarin. Adult or parent accounts control billing and AI connections."}
            </p>
          </div>
        </div>
        <AiBusinessSnapshot locale={locale} snapshot={businessSnapshot} />
        <AiLearningForm initialPlans={state.generatedPlans.filter((plan) => plan.status === "active")} locale={locale} usageSummary={usageSummary} />
        <AdSlot childMode={state.learningSources.some((source) => source.childMode)} locale={locale} />
      </section>
    </AppShell>
  );
}
