import { AppShell } from "@/components/layout/app-shell";
import { getDashboardSnapshot } from "@/lib/content";
import { getLocaleCopy } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { getLearningPerformanceRows, getWeakLearningTypes } from "@/lib/practice-performance";
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
  const currentPlanDay = state.plan.find((item) => item.dayNumber === state.currentDay) ?? state.plan[0];
  const currentLesson = currentPlanDay ? state.lessons[currentPlanDay.lessonId] : undefined;
  const performanceRows = getLearningPerformanceRows(learningPerformance);
  const weakestType = getWeakLearningTypes(learningPerformance)[0];

  return (
    <AppShell activePath="/progress" locale={locale} userEmail={user?.email}>
      <section className="stack progress-page">
        <div className="panel-header">
          <div>
            <div className="eyebrow">{copy.progress.eyebrow}</div>
            <h1 className="page-title">{copy.progress.title}</h1>
          </div>
        </div>

        <div className="progress-grid">
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
        </div>

        {currentPlanDay && currentLesson ? (
          <div className="review-card progress-current-card">
            <div className="progress-current-meta">
              <div className="eyebrow">{copy.progress.currentFocus}</div>
              <span className="pill lesson-meta-pill-secondary">{copy.progress.currentPill}</span>
            </div>
            <div className="progress-current-head">
              <span className="pill">{copy.progress.dayLabel(currentPlanDay.dayNumber)}</span>
              <p className="subtle">{copy.progress.unitLabel(currentPlanDay.unitNumber, currentPlanDay.unitTitle)}</p>
            </div>
            <h2 className="section-title">{currentPlanDay.title}</h2>
            <p className="subtle">{currentPlanDay.objective}</p>
            <div className="muted-box progress-current-note">
              <div className="eyebrow">{copy.progress.nextSession}</div>
              <p className="subtle">{currentLesson.intro}</p>
            </div>
          </div>
        ) : null}

        <div className="lesson-grid progress-detail-grid">
          <div className="review-card progress-map-card">
            <div className="eyebrow">{copy.progress.planMap}</div>
            <div className="progress-unit-list">
              {state.courseTrack.units.map((unit) => {
                const completedCount = unit.lessons.filter((lesson) => lesson.dayNumber < state.currentDay).length;
                const progressValue = Math.round((completedCount / unit.lessons.length) * 100);

                return (
                  <article key={unit.id} className="progress-unit-card">
                    <div className="progress-unit-head">
                      <div>
                        <div className="progress-unit-label">{copy.progress.unitLabel(unit.unitNumber, unit.title)}</div>
                        <h3 className="progress-unit-title">{unit.title}</h3>
                      </div>
                      <div className="progress-unit-meta">
                        <span className="pill lesson-meta-pill-secondary">{copy.progress.stageLabel(unit.stage)}</span>
                        <div className="progress-unit-count">
                          {copy.progress.unitProgress(completedCount, unit.lessons.length)}
                        </div>
                      </div>
                    </div>
                    <p className="subtle">{unit.summary}</p>
                    <div className="progress-bar" aria-hidden="true">
                      <div className="progress-bar-fill" style={{ width: `${progressValue}%` }} />
                    </div>
                    <div className="progress-lesson-list">
                      {unit.lessons.map((lesson) => {
                        const isDone = lesson.dayNumber < state.currentDay;
                        const isCurrent = lesson.dayNumber === state.currentDay;

                        return (
                          <div
                            key={lesson.id}
                            className={`progress-lesson-row${isCurrent ? " current" : ""}${isDone ? " done" : ""}`}
                          >
                            <span className="progress-lesson-day">{copy.progress.dayLabel(lesson.dayNumber)}</span>
                            <div className="progress-lesson-copy">
                              <strong>{lesson.title}</strong>
                              <span className="subtle">{lesson.objective}</span>
                            </div>
                            <span className="progress-lesson-state">
                              {isCurrent
                                ? copy.progress.statusCurrent
                                : isDone
                                  ? copy.progress.statusDone
                                  : copy.progress.statusUpcoming}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
          <div className="review-card progress-weak-card">
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
          <div className="review-card progress-weak-card">
            <div className="eyebrow">{copy.progress.weaknessTrend}</div>
            <h3 className="section-title">{copy.progress.memoryWatch}</h3>
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
