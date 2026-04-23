import { AppShell } from "@/components/layout/app-shell";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { getLocaleCopy } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { readState } from "@/lib/store";
import { getCurrentUser, getSessionIdFromHeaders } from "@/lib/session";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ProfileGoalsPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string; edit?: string; updated?: string }>;
}) {
  const sessionId = await getSessionIdFromHeaders();
  const user = await getCurrentUser();
  const state = await readState(sessionId);
  const locale = await getLocale();
  const copy = getLocaleCopy(locale);
  const { next, edit } = await searchParams;
  const nextPath = next?.startsWith("/") ? next : "/dashboard";
  const isEditing = edit === "1" || !state.onboarded;
  const profileDefaults = state.onboarded && edit !== "1"
    ? {
        dailyMinutes: state.profile?.dailyMinutes,
        focus: state.profile?.focus,
        level: state.profile?.level,
        nativeLanguage: state.profile?.nativeLanguage,
        targetLanguage: state.profile?.targetLanguage
      }
    : undefined;

  return (
    <AppShell activePath="/profile/goals" locale={locale} userEmail={user?.email}>
      <section className="stack profile-page-section">
        <div className="panel-header profile-page-header">
          <div>
            <div className="eyebrow">{copy.onboarding.eyebrow}</div>
            <h1 className="page-title">{copy.onboarding.title}</h1>
            <p className="lede">{copy.onboarding.body}</p>
          </div>
        </div>
        <div className="profile-page-body">
          <div className="review-card profile-page-card">
            {isEditing ? (
              <>
                <h3 className="section-title">{copy.onboarding.profile}</h3>
                <OnboardingForm
                  defaults={profileDefaults}
                  locale={locale}
                  nextPath={nextPath}
                  returnPath={state.onboarded ? "/profile/goals" : undefined}
                />
              </>
            ) : (
              <div className="stack onboarding-complete">
                <div className="eyebrow">{copy.onboarding.completeEyebrow}</div>
                <h3 className="section-title">{copy.onboarding.completeTitle}</h3>
                <p className="subtle">{copy.onboarding.completeBody}</p>
                <div className="muted-box onboarding-summary">
                  <div className="onboarding-summary-grid">
                    <div className="onboarding-summary-item">
                      <span className="onboarding-summary-label">{copy.onboarding.nativeLanguage}</span>
                      <strong className="onboarding-summary-value">
                        {state.profile ? copy.profileLabels.nativeLanguage[state.profile.nativeLanguage] : "-"}
                      </strong>
                    </div>
                    <div className="onboarding-summary-item">
                      <span className="onboarding-summary-label">{copy.onboarding.targetLanguage}</span>
                      <strong className="onboarding-summary-value">
                        {state.profile ? copy.profileLabels.targetLanguage[state.profile.targetLanguage] : "-"}
                      </strong>
                    </div>
                    <div className="onboarding-summary-item">
                      <span className="onboarding-summary-label">{copy.onboarding.level}</span>
                      <strong className="onboarding-summary-value">
                        {state.profile ? copy.profileLabels.levelTitle[state.profile.level] : "-"}
                      </strong>
                    </div>
                    <div className="onboarding-summary-item">
                      <span className="onboarding-summary-label">{copy.onboarding.focus}</span>
                      <strong className="onboarding-summary-value">
                        {state.profile ? copy.profileLabels.focus[state.profile.focus] : "-"}
                      </strong>
                    </div>
                    <div className="onboarding-summary-item onboarding-summary-item-wide">
                      <span className="onboarding-summary-label">{copy.onboarding.dailyMinutes}</span>
                      <strong className="onboarding-summary-value">
                        {state.profile ? copy.onboarding.minutesValue(state.profile.dailyMinutes) : "-"}
                      </strong>
                    </div>
                  </div>
                </div>
                <Link className="button onboarding-reset-button profile-page-actions" href="/profile/goals?edit=1">
                  {copy.onboarding.resetGoal}
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
