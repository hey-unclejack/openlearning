import { AppShell } from "@/components/layout/app-shell";
import { SupervisorModeControls } from "@/components/profile/supervisor-mode-controls";
import { getLocale } from "@/lib/i18n-server";
import { getCurrentUser, getSessionIdFromHeaders } from "@/lib/session";
import { readState } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ProfileLearnersPage() {
  const [locale, user, sessionId] = await Promise.all([getLocale(), getCurrentUser(), getSessionIdFromHeaders()]);
  const state = await readState(sessionId);
  const isZh = locale === "zh-TW";

  return (
    <AppShell activePath="/profile/learners" locale={locale} userEmail={user?.email}>
      <section className="stack profile-page-section">
        <div className="panel-header profile-page-header">
          <div>
            <div className="eyebrow">{isZh ? "學習者" : "Learners"}</div>
            <h1 className="page-title">{isZh ? "家長 / 老師管理的孩子" : "Parent / teacher managed learners"}</h1>
            <p className="lede">{isZh ? "孩子檔案彼此隔離，各自有 goals、SRS、進度與複習紀錄。" : "Child profiles are isolated, each with their own goals, SRS, progress, and review history."}</p>
          </div>
        </div>
        <SupervisorModeControls
          hasSupervisorPin={Boolean(state.supervisorPinHash)}
          learners={state.learners ?? []}
          locale={locale}
        />
        <div className="review-card stack">
          <div className="generated-plan-list">
            {(state.learners ?? []).map((learner) => (
              <article className="generated-plan-item" key={learner.id}>
                <div>
                  <h2 className="section-title">{learner.displayName}</h2>
                  <p className="subtle">
                    {learner.kind === "self" ? (isZh ? "本人" : "Self") : (isZh ? "受監護學生" : "Supervised student")} · {learner.profile.goals?.length ?? 0} goals
                  </p>
                </div>
                <span className="pill lesson-meta-pill-secondary">
                  {state.activeLearnerId === learner.id ? (isZh ? "目前" : "Active") : learner.restrictions.learningOnly ? (isZh ? "兒童模式" : "Child mode") : (isZh ? "成人" : "Adult")}
                </span>
              </article>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
