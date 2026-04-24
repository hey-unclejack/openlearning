import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { ReviewPlanningCard } from "@/components/study/review-planning-card";
import { getDashboardSnapshot } from "@/lib/content";
import { getLocaleCopy } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { getWeakLearningTypes } from "@/lib/practice-performance";
import { getTodayReviewPlan } from "@/lib/store";
import { getCurrentUser, getLearningPerformanceFromHeaders, getSessionIdFromHeaders } from "@/lib/session";

export default async function DashboardPage() {
  const sessionId = await getSessionIdFromHeaders();
  const user = await getCurrentUser();
  const learningPerformance = await getLearningPerformanceFromHeaders();
  const snapshot = await getDashboardSnapshot(sessionId);
  const reviewPlan = await getTodayReviewPlan(sessionId);
  const locale = await getLocale();
  const copy = getLocaleCopy(locale);
  const unitLessons = snapshot.unit?.lessons ?? [];
  const currentIndex = snapshot.courseLesson ? unitLessons.findIndex((item) => item.id === snapshot.courseLesson?.id) : -1;
  const nextLesson = currentIndex >= 0 ? unitLessons[currentIndex + 1] : undefined;
  const completedInUnit = currentIndex >= 0 ? currentIndex : 0;
  const weakTypes = getWeakLearningTypes(learningPerformance).slice(0, 2);

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
          <div className="metric-card">
            <div className="metric-label subtle">{copy.dashboard.formalReviewLabel}</div>
            <div className="metric-value">{snapshot.stats.formalReviews}</div>
            <p className="subtle">{copy.dashboard.formalReviewBody}</p>
          </div>
          <div className="metric-card">
            <div className="metric-label subtle">{copy.dashboard.extraReviewLabel}</div>
            <div className="metric-value">{snapshot.stats.extraReviews}</div>
            <p className="subtle">{copy.dashboard.extraReviewBody}</p>
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
            {snapshot.unit ? (
              <div className="muted-box dashboard-lesson-fit">
                <div className="eyebrow">{copy.dashboard.fitLabel}</div>
                <p className="subtle">{snapshot.unit.summary}</p>
                <p className="subtle">{snapshot.lesson.personalizationNote}</p>
                <p className="subtle">{copy.dashboard.unitProgress(completedInUnit, unitLessons.length)}</p>
                <div className="today-focus-list">
                  <div className="eyebrow">{copy.dashboard.focusBoostLabel}</div>
                  <p className="subtle">{copy.dashboard.focusBoostBody}</p>
                  <div className="today-focus-pills">
                    {weakTypes.map((type) => (
                      <span key={type} className="pill lesson-meta-pill-secondary">
                        {copy.dashboard.learningTypeLabel(type)}
                      </span>
                    ))}
                  </div>
                </div>
                {nextLesson ? (
                  <p className="subtle">
                    {copy.dashboard.nextLessonLabel} {nextLesson.title}
                  </p>
                ) : null}
              </div>
            ) : null}
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

        <div className="lesson-grid progress-detail-grid">
          <div className="review-card dashboard-side-card">
            <ReviewPlanningCard
              body={copy.dashboard.queueBody}
              bucketSummary={{
                must: copy.dashboard.mustDoLabel(reviewPlan.counts.must, reviewPlan.must.estimatedMinutes),
                should: copy.dashboard.shouldDoLabel(reviewPlan.counts.should, reviewPlan.should.estimatedMinutes),
                can: copy.dashboard.canDoLabel(reviewPlan.counts.can, reviewPlan.can.estimatedMinutes),
              }}
              className="stack"
              locale={locale}
              title={copy.dashboard.queueEyebrow}
              weakLabel={copy.dashboard.focusBoostLabel}
              weakTypes={weakTypes}
            />
            <div className="button-row">
              <Link className="button" href="/study/review">
                {copy.dashboard.openReview}
              </Link>
            </div>
          </div>
          <div className="review-card dashboard-side-card">
            <div className="eyebrow">{copy.dashboard.lessonHotspotEyebrow}</div>
            <ul className="list">
              {snapshot.lessonHotspots.length === 0 ? (
                <li className="subtle">{copy.dashboard.noHotspots}</li>
              ) : (
                snapshot.lessonHotspots.map((item) => (
                  <li key={item.lessonId}>
                    <strong>{item.lessonTitle}</strong>
                    <div className="subtle">
                      {copy.dashboard.lessonHotspotBody(item.misses, Math.round(item.missRate * 100))}
                    </div>
                  </li>
                ))
              )}
            </ul>
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
        </div>
      </section>
    </AppShell>
  );
}
