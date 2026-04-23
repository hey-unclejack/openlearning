import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { getDashboardSnapshot } from "@/lib/content";
import { getLocaleCopy } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { getCurrentUser, getSessionIdFromHeaders } from "@/lib/session";

export default async function DashboardPage() {
  const sessionId = await getSessionIdFromHeaders();
  const user = await getCurrentUser();
  const snapshot = await getDashboardSnapshot(sessionId);
  const locale = await getLocale();
  const copy = getLocaleCopy(locale);

  return (
    <AppShell activePath="/dashboard" locale={locale} userEmail={user?.email}>
      <section className="stack dashboard-page">
        <div className="panel-header">
          <div>
            <div className="eyebrow">{copy.dashboard.eyebrow}</div>
            <h1 className="page-title">{copy.dashboard.title}</h1>
          </div>
          <Link className="button" href="/study/today">
            {copy.dashboard.startToday}
          </Link>
        </div>

        <div className="dashboard-grid">
          <div className="metric-card">
            <div className="metric-label subtle">{copy.dashboard.dueNow}</div>
            <div className="metric-value">{snapshot.stats.dueCount}</div>
            <p className="subtle">{copy.dashboard.dueBody}</p>
          </div>
          <div className="metric-card">
            <div className="metric-label subtle">{copy.dashboard.retentionScore}</div>
            <div className="metric-value">{snapshot.retentionScore}%</div>
            <p className="subtle">{copy.dashboard.retentionBody}</p>
          </div>
          <div className="metric-card">
            <div className="metric-label subtle">{copy.dashboard.currentStreak}</div>
            <div className="metric-value">
              {snapshot.stats.streak} {copy.dashboard.streakUnit}
            </div>
            <p className="subtle">{copy.dashboard.streakBody}</p>
          </div>
        </div>

        <div className="lesson-grid dashboard-lesson-grid">
          <div className="review-card dashboard-lesson-card">
            <div className="dashboard-lesson-meta">
              <div className="eyebrow">{copy.dashboard.currentLesson}</div>
              <span className="pill lesson-meta-pill-secondary">{copy.dashboard.lessonPill}</span>
            </div>
            <div className="dashboard-lesson-head">
              <span className="pill">{copy.dashboard.dayLabel(snapshot.planDay.dayNumber)}</span>
              <p className="subtle">{copy.dashboard.unitLabel(snapshot.planDay.unitNumber, snapshot.planDay.unitTitle)}</p>
            </div>
            <h2 className="section-title">{snapshot.planDay.title}</h2>
            <p className="subtle">{snapshot.planDay.objective}</p>
            <div className="muted-box dashboard-lesson-note">
              <div className="eyebrow">{copy.dashboard.beforeBegin}</div>
              <p className="subtle">{snapshot.lesson.intro}</p>
            </div>
            <div className="button-row">
              <Link className="button-secondary" href={`/study/lesson/${snapshot.planDay.lessonId}`}>
                {copy.dashboard.openLesson}
              </Link>
            </div>
          </div>
          <div className="review-card dashboard-side-card">
            <div className="eyebrow">{copy.dashboard.weakSpots}</div>
            <ul className="list">
              {snapshot.stats.weakItems.map((item) => (
                <li key={item.id}>
                  <strong>{item.back}</strong>
                  <div className="subtle">
                    {copy.dashboard.lapses} {item.lapseCount}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="review-card dashboard-side-card">
          <div className="eyebrow">{copy.dashboard.recentReview}</div>
          <ul className="list">
            {snapshot.recentLogs.length === 0 ? (
              <li className="subtle">{copy.dashboard.noLogs}</li>
            ) : (
              snapshot.recentLogs.map((log) => (
                <li key={`${log.itemId}-${log.reviewedAt}`}>
                  <strong>{log.grade}</strong>
                  <div className="subtle">
                    {copy.dashboard.nextDue} {new Date(log.nextDueDate).toLocaleDateString(locale)}
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>
    </AppShell>
  );
}
