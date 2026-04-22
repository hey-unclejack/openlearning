import { AppShell } from "@/components/layout/app-shell";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { readState } from "@/lib/store";
import { getCurrentUser, getSessionIdFromHeaders } from "@/lib/session";

export default async function OnboardingPage() {
  const sessionId = await getSessionIdFromHeaders();
  const user = await getCurrentUser();
  const state = await readState(sessionId);

  return (
    <AppShell activePath="/onboarding" userEmail={user?.email}>
      <section className="stack">
        <div className="panel-header">
          <div>
            <div className="eyebrow">Learner Setup</div>
            <h1 className="page-title">Set the rhythm before you scale content.</h1>
            <p className="lede">
              v1 先把語言、程度、學習目標和每日時間定清楚，之後 lesson 與 SRS queue 才能一致。
            </p>
          </div>
        </div>
        <div className="lesson-grid">
          <div className="review-card">
            <h3 className="section-title">Profile</h3>
            <OnboardingForm />
          </div>
          <div className="review-card">
            <h3 className="section-title">Current defaults</h3>
            <ul className="list">
              <li>Language: {state.profile?.targetLanguage}</li>
              <li>Level: {state.profile?.level}</li>
              <li>Focus: {state.profile?.focus}</li>
              <li>Daily minutes: {state.profile?.dailyMinutes}</li>
            </ul>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
