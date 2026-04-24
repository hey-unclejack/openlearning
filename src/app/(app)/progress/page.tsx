import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { ProgressCourseManager } from "@/components/progress/progress-course-manager";
import { ReviewPlanningCard } from "@/components/study/review-planning-card";
import { getDashboardSnapshot } from "@/lib/content";
import { getLocaleCopy } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { getActiveLearningGoal } from "@/lib/learning-goals";
import { getLearningPerformanceRows, getWeakLearningTypes } from "@/lib/practice-performance";
import { buildEffectiveCoursePlan, canManageCoursePlan, deriveReplanRecommendations } from "@/lib/progress-planning";
import { readState } from "@/lib/store";
import { getCurrentUser, getLearningPerformanceFromHeaders, getSessionIdFromHeaders } from "@/lib/session";

export default async function ProgressPage() {
  const sessionId = await getSessionIdFromHeaders();
  const user = await getCurrentUser();
  const learningPerformance = await getLearningPerformanceFromHeaders();
  const snapshot = await getDashboardSnapshot(sessionId);
  const state = await readState(sessionId);
  const locale = await getLocale();
  const copy = getLocaleCopy(locale);
  const activeDomain = state.profile ? getActiveLearningGoal(state.profile).domain : "language";
  const performanceRows = getLearningPerformanceRows(learningPerformance, activeDomain);
  const weakestType = getWeakLearningTypes(learningPerformance, activeDomain)[0];
  const effectivePlan = buildEffectiveCoursePlan(state);
  const canManage = canManageCoursePlan(state);
  const firstReplaceableFixed = effectivePlan.lessons.find(
    (lesson) => lesson.source === "fixed" && lesson.status !== "completed" && lesson.status !== "skipped",
  );
  const recommendations = deriveReplanRecommendations({
    state,
    performance: learningPerformance,
    weakestType,
    lessonHotspots: snapshot.lessonHotspots,
    locale,
  });
  const railContent = (
    <>
      <div className="content-panel rail-panel progress-rail-panel progress-ai-panel">
        <div>
          <div className="eyebrow">{locale === "zh-TW" ? "課程安排" : "Course planning"}</div>
          <h3 className="section-title">{locale === "zh-TW" ? "用 AI 調整未完成課程" : "Adjust upcoming lessons with AI"}</h3>
        </div>
        {canManage ? (
          <div className="progress-ai-action-list">
            <Link className="button" href="/ai?progressMode=append">
              {locale === "zh-TW" ? "AI 加入課程" : "AI add lessons"}
            </Link>
            {firstReplaceableFixed ? (
              <Link className="button-secondary" href={`/ai?progressMode=replace-fixed&replaceFromDayNumber=${firstReplaceableFixed.dayNumber}`}>
                {locale === "zh-TW" ? "AI 取代未完成段落" : "AI replace upcoming"}
              </Link>
            ) : null}
          </div>
        ) : (
          <p className="subtle">{locale === "zh-TW" ? "此學習者目前只能查看與學習，無法調整課程計劃。" : "This learner can view and study, but cannot adjust the course plan."}</p>
        )}
      </div>

      <div className="content-panel rail-panel progress-rail-panel">
        <div className="eyebrow">{locale === "zh-TW" ? "系統重新安排建議" : "System replan recommendations"}</div>
        <div className="progress-recommendation-list">
          {recommendations.map((recommendation) => (
            <article className="muted-box progress-recommendation-card" key={recommendation.kind}>
              <strong>{recommendation.title}</strong>
              <p className="subtle">{recommendation.body}</p>
              {recommendation.href ? (
                <Link className="button-secondary" href={recommendation.href}>
                  {recommendation.actionLabel}
                </Link>
              ) : null}
            </article>
          ))}
        </div>
      </div>

      <div className="content-panel rail-panel progress-rail-panel">
        <div className="progress-grid progress-side-metrics">
          <div className="metric-card progress-metric-card">
            <div className="metric-label subtle">{copy.progress.completedDays}</div>
            <div className="metric-value">
              {snapshot.stats.completedDays}/{snapshot.stats.planDays}
            </div>
          </div>
          <div className="metric-card progress-metric-card">
            <div className="metric-label subtle">{copy.progress.masteredItems}</div>
            <div className="metric-value">{snapshot.stats.masteredCount}</div>
          </div>
          <div className="metric-card progress-metric-card">
            <div className="metric-label subtle">{copy.progress.reviewAttempts}</div>
            <div className="metric-value">{snapshot.stats.totalReviews}</div>
          </div>
          <div className="metric-card progress-metric-card">
            <div className="metric-label subtle">{copy.progress.formalReviewLabel}</div>
            <div className="metric-value">{snapshot.stats.formalReviews}</div>
          </div>
          <div className="metric-card progress-metric-card">
            <div className="metric-label subtle">{copy.progress.extraReviewLabel}</div>
            <div className="metric-value">{snapshot.stats.extraReviews}</div>
          </div>
        </div>
      </div>

      <div className="content-panel rail-panel progress-rail-panel">
        <ReviewPlanningCard
          body={copy.progress.extraReviewBody}
          className="stack"
          locale={locale}
          title={copy.progress.extraReviewEyebrow}
          weakLabel={copy.progress.weakFocusTitle}
          weakTypes={weakestType ? [weakestType] : []}
        />
        <h3 className="section-title">{copy.progress.extraReviewTitle}</h3>
        <div className="button-row">
          <Link className="button" href="/study/review/extra?scope=all">
            {copy.progress.extraReviewAll}
          </Link>
          <Link className="button-secondary" href="/study/review/extra?scope=recent">
            {copy.progress.extraReviewRecent}
          </Link>
          <Link className="button-secondary" href="/study/review/extra?scope=weak">
            {copy.progress.extraReviewWeak}
          </Link>
        </div>
      </div>

      <div className="content-panel rail-panel progress-rail-panel">
        <div className="eyebrow">{copy.progress.skillProfile}</div>
        <h3 className="section-title">{copy.progress.skillProfileTitle}</h3>
        <div className="progress-skill-list">
          {performanceRows.map((row) => (
            <div key={row.learningType} className="progress-skill-card">
              <div className="progress-skill-head">
                <strong>{copy.progress.learningTypeLabel(row.learningType)}</strong>
                <span className="progress-unit-count">{copy.progress.accuracyLabel} {Math.round(row.accuracy * 100)}%</span>
              </div>
              <div className="progress-bar" aria-hidden="true">
                <div className="progress-bar-fill" style={{ width: `${Math.round(row.accuracy * 100)}%` }} />
              </div>
              <div className="subtle">
                {copy.progress.attemptsLabel} {row.attempts}
              </div>
            </div>
          ))}
        </div>
        <div className="muted-box progress-current-note">
          <div className="eyebrow">{copy.progress.weakFocusTitle}</div>
          <p className="subtle">{copy.progress.weakFocusBody}</p>
          <span className="pill lesson-meta-pill-secondary">
            {copy.progress.learningTypeLabel(weakestType)}
          </span>
        </div>
      </div>

      <div className="content-panel rail-panel progress-rail-panel">
        <div className="eyebrow">{copy.progress.weaknessTrend}</div>
        <h3 className="section-title">{copy.progress.memoryWatch}</h3>
        <ul className="list">
          {snapshot.stats.weakItems.map((item) => (
            <li key={item.id}>
              <strong>{item.back}</strong>
              <div className="subtle">
                {copy.progress.lapses} {item.lapseCount}, {copy.progress.interval} {item.intervalDays} {copy.progress.dayUnit}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="content-panel rail-panel progress-rail-panel">
        <div className="eyebrow">{copy.progress.lessonHotspotEyebrow}</div>
        <h3 className="section-title">{copy.progress.lessonHotspotTitle}</h3>
        <ul className="list">
          {snapshot.lessonHotspots.map((item) => (
            <li key={item.lessonId}>
              <strong>{item.lessonTitle}</strong>
              <div className="subtle">{copy.progress.lessonHotspotBody(item.misses, Math.round(item.missRate * 100))}</div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );

  return (
    <AppShell activePath="/progress" locale={locale} railContent={railContent} userEmail={user?.email}>
      <section className="stack progress-page">
        <div className="panel-header">
          <div>
            <div className="eyebrow">{copy.progress.eyebrow}</div>
            <h1 className="page-title">{copy.progress.title}</h1>
          </div>
        </div>

        <ProgressCourseManager
          canManage={canManage}
          lessons={effectivePlan.lessons}
          locale={locale}
          recommendations={recommendations}
          showRecommendations={false}
        />
      </section>
    </AppShell>
  );
}
