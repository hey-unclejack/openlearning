import { AppShell } from "@/components/layout/app-shell";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { getLocaleCopy } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { readState } from "@/lib/store";
import { getCurrentUser, getSessionIdFromHeaders } from "@/lib/session";

export default async function OnboardingPage() {
  const sessionId = await getSessionIdFromHeaders();
  const user = await getCurrentUser();
  const state = await readState(sessionId);
  const locale = await getLocale();
  const copy = getLocaleCopy(locale);

  return (
    <AppShell activePath="/onboarding" locale={locale} userEmail={user?.email}>
      <section className="stack">
        <div className="panel-header">
          <div>
            <div className="eyebrow">{copy.onboarding.eyebrow}</div>
            <h1 className="page-title">{copy.onboarding.title}</h1>
            <p className="lede">{copy.onboarding.body}</p>
          </div>
        </div>
        <div className="lesson-grid">
          <div className="review-card">
            <h3 className="section-title">{copy.onboarding.profile}</h3>
            <OnboardingForm locale={locale} />
          </div>
          <div className="review-card">
            <h3 className="section-title">{copy.onboarding.currentDefaults}</h3>
            <ul className="list">
              <li>
                {copy.onboarding.targetLanguage}: {state.profile?.targetLanguage}
              </li>
              <li>
                {copy.onboarding.level}: {state.profile?.level}
              </li>
              <li>
                {copy.onboarding.focus}: {state.profile?.focus}
              </li>
              <li>
                {copy.onboarding.dailyMinutes}: {state.profile?.dailyMinutes}
              </li>
            </ul>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
