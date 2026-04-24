import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { ReviewPlanningCard } from "@/components/study/review-planning-card";
import { getLocaleCopy } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { getActiveLearningGoal, getNextGeneratedPlanDay, hasFixedCourseTrack } from "@/lib/learning-goals";
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
  const state = await readState(sessionId);
  const locale = await getLocale();
  const copy = getLocaleCopy(locale);
  const isZh = locale === "zh-TW";
  const activeGoal = state.profile ? getActiveLearningGoal(state.profile) : undefined;
  const usesFixedCourseTrack = hasFixedCourseTrack(activeGoal);
  const generatedPlanDay = getNextGeneratedPlanDay(state.generatedPlans, activeGoal);
  const generatedHref = generatedPlanDay ? `/study/generated/${generatedPlanDay.plan.id}/${generatedPlanDay.day.lessonId}` : "/ai";
  const { completedLesson, completedLessonId, completedUnit, unitCompleted, nextLessonId } = await searchParams;
  const unitLessons = unit?.lessons ?? [];
  const currentIndex = courseLesson ? unitLessons.findIndex((item) => item.id === courseLesson.id) : -1;
  const nextLesson = currentIndex >= 0 ? unitLessons[currentIndex + 1] : undefined;
  const completedInUnit = currentIndex >= 0 ? currentIndex : 0;
  const activeDomain = usesFixedCourseTrack ? courseLesson?.domain ?? "language" : activeGoal?.domain ?? "general";
  const weakTypes = getWeakLearningTypes(learningPerformance, activeDomain).slice(0, 2);
  const reviewDebt = reviewPlan.counts.must + reviewPlan.counts.should;
  const nextActionCopy =
    reviewPlan.nextBestAction === "review"
      ? isZh ? "先穩住記憶，再開新課" : "Stabilize memory before the lesson"
      : reviewPlan.nextBestAction === "reinforce"
        ? isZh ? "今日適合補強弱項" : "Today is good for reinforcement"
        : isZh ? "可以直接推進新課" : "Ready for the next lesson";
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
          performance: learningPerformance,
          domain: getActiveLearningGoal(completedState.profile).domain
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
        <div className="today-operating-strip">
          <div>
            <div className="eyebrow">{isZh ? "今日任務判斷" : "Today's operating signal"}</div>
            <h2>{nextActionCopy}</h2>
            <p className="subtle">
              {isZh
                ? `正式複習 ${reviewDebt} 張，預估 ${reviewPlan.estimatedMinutes} 分鐘；記憶健康 ${reviewPlan.memoryHealth}。`
                : `${reviewDebt} formal reviews, about ${reviewPlan.estimatedMinutes} min; memory health ${reviewPlan.memoryHealth}.`}
            </p>
          </div>
          <div className="today-operating-metrics">
            <span>{reviewPlan.counts.must}</span>
            <small>{isZh ? "必做" : "must"}</small>
            <span>{reviewPlan.counts.should}</span>
            <small>{isZh ? "建議" : "should"}</small>
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
                {reviewDebt > 0 ? copy.todayPage.startReview : (isZh ? "檢查複習佇列" : "Check review queue")}
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
              <span className="pill">
                {usesFixedCourseTrack
                  ? copy.todayPage.dayLabel(planDay.dayNumber)
                  : generatedPlanDay
                    ? `AI Day ${generatedPlanDay.day.dayNumber}`
                    : isZh ? "尚未建立計劃" : "No plan yet"}
              </span>
              <p className="subtle">
                {usesFixedCourseTrack
                  ? copy.todayPage.unitLabel(planDay.unitNumber, planDay.unitTitle)
                  : activeGoal?.title ?? (isZh ? "AI / 內容生成計劃" : "AI / generated plan")}
              </p>
            </div>
            <h2 className="section-title">
              {usesFixedCourseTrack
                ? lesson.id ? planDay.title : copy.todayPage.noLesson
                : generatedPlanDay?.day.title ?? (isZh ? "先建立一份內容學習計劃" : "Create a generated learning plan first")}
            </h2>
            <p className="subtle">
              {usesFixedCourseTrack
                ? planDay.objective
                : generatedPlanDay?.day.objective ??
                  (isZh
                    ? "這個學習目標沒有固定課程地圖。請到 AI 導入貼上教材、文章、題目或主題，系統會轉成短課與 SRS。"
                    : "This learning goal does not use a fixed course map. Open AI intake with a source, topic, problem set, or content and turn it into short lessons and SRS.")}
            </p>
            {usesFixedCourseTrack && unit ? (
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
            ) : generatedPlanDay ? (
              <div className="muted-box today-lesson-fit">
                <div className="eyebrow">{isZh ? "生成計劃進度" : "Generated plan progress"}</div>
                <p className="subtle">
                  {generatedPlanDay.day.dayNumber} / {generatedPlanDay.plan.days.length}
                </p>
                <ReviewPlanningCard
                  body={copy.todayPage.todayBoostBody}
                  className="muted-box today-lesson-fit"
                  locale={locale}
                  title={copy.todayPage.todayBoostLabel}
                  weakTypes={weakTypes}
                />
              </div>
            ) : null}
            <div className="muted-box today-lesson-note">
              <div className="eyebrow">{copy.todayPage.beforeBegin}</div>
              <p className="subtle">
                {usesFixedCourseTrack
                  ? lesson.intro
                  : generatedPlanDay?.day.asset.intro ?? (isZh ? "先建立計劃，再回到這裡開始今日任務。" : "Create a plan first, then return here to start today's task.")}
              </p>
            </div>
            <div className="button-row">
              <Link className={reviewDebt > 0 ? "button-secondary" : "button"} href={usesFixedCourseTrack ? `/study/lesson/${planDay.lessonId}` : generatedHref}>
                {usesFixedCourseTrack || generatedPlanDay ? copy.todayPage.openLesson : (isZh ? "前往 AI 導入" : "Open AI intake")}
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
              {usesFixedCourseTrack && nextLesson ? (
                <p className="subtle">
                  {copy.todayPage.nextLessonLabel} {nextLesson.title}
                </p>
              ) : generatedPlanDay ? (
                <p className="subtle">
                  {isZh ? "下一步：" : "Next: "} {generatedPlanDay.day.title}
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
