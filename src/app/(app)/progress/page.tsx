import { AppShell } from "@/components/layout/app-shell";
import { getDashboardSnapshot } from "@/lib/content";
import { getLocaleCopy } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { readState } from "@/lib/store";
import { getCurrentUser, getSessionIdFromHeaders } from "@/lib/session";

export default async function ProgressPage() {
  const sessionId = await getSessionIdFromHeaders();
  const user = await getCurrentUser();
  const snapshot = await getDashboardSnapshot(sessionId);
  const state = await readState(sessionId);
  const locale = await getLocale();
  const copy = getLocaleCopy(locale);

  return (
    <AppShell activePath="/progress" locale={locale} userEmail={user?.email}>
      <section className="stack">
        <div className="panel-header">
          <div>
            <div className="eyebrow">{copy.progress.eyebrow}</div>
            <h1 className="page-title">{copy.progress.title}</h1>
          </div>
        </div>

        <div className="progress-grid">
          <div className="metric-card">
            <div className="metric-label subtle">{copy.progress.completedDays}</div>
            <div className="metric-value">
              {snapshot.stats.completedDays}/{snapshot.stats.planDays}
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-label subtle">{copy.progress.masteredItems}</div>
            <div className="metric-value">{snapshot.stats.masteredCount}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label subtle">{copy.progress.reviewAttempts}</div>
            <div className="metric-value">{snapshot.stats.totalReviews}</div>
          </div>
        </div>

        <div className="lesson-grid">
          <div className="review-card">
            <h3 className="section-title">{copy.progress.planMap}</h3>
            <ul className="list">
              {state.plan.map((day) => (
                <li key={day.id}>
                  <strong>
                    {copy.progress.day}
                    {day.dayNumber}
                    {copy.progress.daySuffix}: {day.title}
                  </strong>
                  <div className="subtle">{day.objective}</div>
                </li>
              ))}
            </ul>
          </div>
          <div className="review-card">
            <h3 className="section-title">{copy.progress.weaknessTrend}</h3>
            <ul className="list">
              {snapshot.stats.weakItems.map((item) => (
                <li key={item.id}>
                  <strong>{item.back}</strong>
                  <div className="subtle">
                    {copy.progress.lapses} {item.lapseCount}, {copy.progress.interval} {item.intervalDays}{" "}
                    {copy.progress.dayUnit}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
