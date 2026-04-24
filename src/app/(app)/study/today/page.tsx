import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { ReviewPlanningCard } from "@/components/study/review-planning-card";
import { getLocaleCopy } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import {
  buildDerivedPracticeQuestions,
  getPracticeLearningTypes,
  selectPracticePlan
} from "@/lib/lesson-practice";
import { getWeakLearningTypes } from "@/lib/practice-performance";
import { getTodayLesson, getTodayReviewPlan, readState } from "@/lib/store";
import { getCurrentUser, getLearningPerformanceFromHeaders, getSessionIdFromHeaders } from "@/lib/session";

export default async function TodayPage({
  searchParams
}: {
  searchParams: Promise<{
    completedLesson?: string;
    completedLessonId?: string;
    completedUnit?: string;
    unitCompleted?: string;
    nextLessonId?: string;
  }>;
}) {
  const sessionId = await getSessionIdFromHeaders();
  const user = await getCurrentUser();
  const learningPerformance = await getLearningPerformanceFromHeaders();
  const reviewPlan = await getTodayReviewPlan(sessionId);
  const { lesson, planDay, unit, courseLesson } = await getTodayLesson(sessionId);
  const locale = await getLocale();
  const copy = getLocaleCopy(locale);
  const { completedLesson, completedLessonId, completedUnit, unitCompleted, nextLessonId } = await searchParams;
  const unitLessons = unit?.lessons ?? [];
  const currentIndex = courseLesson ? unitLessons.findIndex((item) => item.id === courseLesson.id) : -1;
  const nextLesson = currentIndex >= 0 ? unitLessons[currentIndex + 1] : undefined;
  const completedInUnit = currentIndex >= 0 ? currentIndex : 0;
  const weakTypes = getWeakLearningTypes(learningPerformance).slice(0, 2);
  const completedState = completedLessonId ? await readState(sessionId) : null;
  const completedCourseLesson = completedLessonId
    ? completedState?.courseTrack.units.flatMap((courseUnit) => courseUnit.lessons).find((item) => item.id === completedLessonId)
    : undefined;
  const completedLessonAsset = completedLessonId ? completedState?.lessons[completedLessonId] : undefined;
  const completedPracticePlan =
    completedState?.profile && completedCourseLesson && completedLessonAsset
      ? selectPracticePlan({
          basePractice: completedLessonAsset.practice,
          derivedPractice: buildDerivedPracticeQuestions({
            reviewSeeds: completedLessonAsset.reviewSeeds,
            chunks: completedCourseLesson.chunks,
            vocabulary: completedCourseLesson.vocabulary,
            dialogue: completedCourseLesson.dialogue
          }),
          level: completedState.profile.level,
          focus: completedState.profile.focus,
          dailyMinutes: completedState.profile.dailyMinutes,
          performance: learningPerformance
        })
      : [];
  const completedPracticeTypes = getPracticeLearningTypes(completedPracticePlan);

  return (
    <AppShell activePath="/study/today" locale={locale} userEmail={user?.email}>
      <section className="stack today-page">
        <div className="panel-header">
          <div>
            <div className="eyebrow">{copy.todayPage.eyebrow}</div>
            <h1 className="page-title">{copy.todayPage.title}</h1>
          </div>
        </div>
        {completedLesson ? (
          <div className="review-card today-complete-card">
            <div className="eyebrow">{copy.todayPage.completedEyebrow}</div>
            <h2 className="section-title">{copy.todayPage.completedTitle(completedLesson)}</h2>
            <p className="subtle">{copy.todayPage.completedBody}</p>
            {completedPracticeTypes.length > 0 ? (
              <div className="muted-box today-complete-unit-box">
                <div className="eyebrow">{copy.todayPage.completedSkillLabel}</div>
                <p className="subtle">{copy.todayPage.completedSkillBody}</p>
                <div className="today-focus-pills">
                  {completedPracticeTypes.map((type) => (
                    <span key={type} className="pill lesson-meta-pill-secondary">
                      {copy.todayPage.learningTypeLabel(type)}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            {weakTypes[0] ? (
              <div className="muted-box today-complete-unit-box">
                <div className="eyebrow">{copy.todayPage.weakSkillLabel}</div>
                <p className="subtle">
                  {copy.todayPage.weakSkillBody(copy.todayPage.learningTypeLabel(weakTypes[0]))}
                </p>
              </div>
            ) : null}
            {unitCompleted === "1" && completedUnit ? (
              <div className="muted-box today-complete-unit-box">
                <div className="eyebrow">{copy.lesson.unitCompletedTitle}</div>
                <p className="subtle">{copy.todayPage.unitCompletedBody(completedUnit)}</p>
              </div>
            ) : null}
            {nextLessonId ? (
              <div className="button-row">
                <Link className="button" href={`/study/lesson/${nextLessonId}`}>
                  {copy.todayPage.continueNextLesson}
                </Link>
              </div>
            ) : null}
          </div>
        ) : null}
        <div className="today-step-flow">
          <div className="review-card today-step-card">
            <div className="today-step-head">
              <div className="eyebrow">{copy.todayPage.step1}</div>
              <span className="pill">{copy.todayPage.reviewPill}</span>
            </div>
            <h2 className="section-title">{copy.todayPage.clearReviews}</h2>
            <p className="subtle">{copy.todayPage.dueMessage(reviewPlan.counts.must + reviewPlan.counts.should)}</p>
            <ReviewPlanningCard
              body={copy.todayPage.todayBudgetBody(
                reviewPlan.budget.reviewMinutes,
                reviewPlan.budget.lessonMinutes,
                reviewPlan.budget.bufferMinutes
              )}
              bucketSummary={{
                must: copy.todayPage.mustDoLabel(reviewPlan.counts.must, reviewPlan.must.estimatedMinutes),
                should: copy.todayPage.shouldDoLabel(reviewPlan.counts.should, reviewPlan.should.estimatedMinutes),
                can: copy.todayPage.canDoLabel(reviewPlan.counts.can, reviewPlan.can.estimatedMinutes),
              }}
              className="muted-box today-lesson-fit"
              locale={locale}
              title={copy.todayPage.todayBudgetLabel}
            />
            <p className="subtle">{copy.todayPage.targetRule}</p>
            <div className="button-row">
              <Link className="button" href="/study/review">
                {copy.todayPage.startReview}
              </Link>
            </div>
          </div>
          <div className="today-step-connector" aria-hidden="true" />
          <div className="review-card today-step-card today-step-card-lesson">
            <div className="today-step-head">
              <div className="eyebrow">{copy.todayPage.step2}</div>
              <span className="pill lesson-meta-pill-secondary">{copy.todayPage.lessonPill}</span>
            </div>
            <div className="today-lesson-meta">
              <span className="pill">{copy.todayPage.dayLabel(planDay.dayNumber)}</span>
              <p className="subtle">{copy.todayPage.unitLabel(planDay.unitNumber, planDay.unitTitle)}</p>
            </div>
            <h2 className="section-title">{lesson.id ? planDay.title : copy.todayPage.noLesson}</h2>
            <p className="subtle">{planDay.objective}</p>
            {unit ? (
              <div className="muted-box today-lesson-fit">
                <div className="eyebrow">{copy.todayPage.fitLabel}</div>
                <p className="subtle">{unit.summary}</p>
                <p className="subtle">{lesson.personalizationNote}</p>
                <p className="subtle">{copy.todayPage.unitProgress(completedInUnit, unitLessons.length)}</p>
                <ReviewPlanningCard
                  body={copy.todayPage.todayBoostBody}
                  className="muted-box today-lesson-fit"
                  locale={locale}
                  title={copy.todayPage.todayBoostLabel}
                  weakTypes={weakTypes}
                />
                {nextLesson ? (
                  <p className="subtle">
                    {copy.todayPage.nextLessonLabel} {nextLesson.title}
                  </p>
                ) : null}
              </div>
            ) : null}
            <div className="muted-box today-lesson-note">
              <div className="eyebrow">{copy.todayPage.beforeBegin}</div>
              <p className="subtle">{lesson.intro}</p>
            </div>
            <div className="button-row">
              <Link className="button-secondary" href={`/study/lesson/${planDay.lessonId}`}>
                {copy.todayPage.openLesson}
              </Link>
            </div>
          </div>
          <div className="today-step-connector" aria-hidden="true" />
          <div className="review-card today-step-card today-step-card-wrap">
            <div className="today-step-head">
              <div className="eyebrow">{copy.todayPage.step3}</div>
              <span className="pill">{copy.todayPage.wrapPill}</span>
            </div>
            <h2 className="section-title">{copy.todayPage.wrapTitle}</h2>
            <p className="subtle">{copy.todayPage.wrapBody}</p>
            <div className="muted-box today-lesson-fit">
              <div className="eyebrow">{copy.todayPage.afterFinishLabel}</div>
              <p className="subtle">{copy.todayPage.afterFinishBody}</p>
              {nextLesson ? (
                <p className="subtle">
                  {copy.todayPage.nextLessonLabel} {nextLesson.title}
                </p>
              ) : (
                <p className="subtle">{copy.todayPage.nextLessonFallback}</p>
              )}
            </div>
            {completedLesson && nextLessonId ? (
              <div className="button-row">
                <Link className="button" href={`/study/lesson/${nextLessonId}`}>
                  {copy.todayPage.continueNextLesson}
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
