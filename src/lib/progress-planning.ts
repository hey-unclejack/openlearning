import { getActiveLearner } from "@/lib/learner-spaces";
import { getActiveGoalPlans, getActiveLearningGoal, hasFixedCourseTrack } from "@/lib/learning-goals";
import { AppState, GeneratedLearningPlan, LearningPerformance, LearningType } from "@/lib/types";

export type EffectiveCourseLessonSource = "fixed" | "generated";
export type EffectiveCourseLessonStatus = "completed" | "current" | "upcoming" | "skipped";
export type ReplanRecommendationKind = "review-first" | "reinforce-skill" | "bridge-hotspot" | "keep-sequence";

export interface EffectiveCourseLesson {
  key: string;
  source: EffectiveCourseLessonSource;
  planId?: string;
  lessonId: string;
  dayNumber: number;
  title: string;
  objective: string;
  status: EffectiveCourseLessonStatus;
  completedAt?: string;
  locked: boolean;
  href: string;
  relearnHref?: string;
  canReplan: boolean;
  canJump: boolean;
}

export interface EffectiveGeneratedPlanSummary {
  id: string;
  title: string;
  status: GeneratedLearningPlan["status"];
  completedCount: number;
  totalCount: number;
}

export interface ReplanRecommendation {
  kind: ReplanRecommendationKind;
  title: string;
  body: string;
  actionLabel: string;
  href?: string;
}

function parseReplaceFixedFromDay(plan: GeneratedLearningPlan) {
  const marker = plan.qualityWarnings.find((warning) => warning.startsWith("replaces-fixed-from-day:"));
  const value = marker ? Number(marker.split(":")[1]) : NaN;
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

function hasAttempts(performance: LearningPerformance, type: LearningType) {
  return (performance[type]?.attempts ?? 0) >= 3;
}

function accuracy(performance: LearningPerformance, type: LearningType) {
  const stat = performance[type];
  return stat && stat.attempts > 0 ? stat.correct / stat.attempts : 1;
}

export function getSkippedFixedLessonIds(state: AppState) {
  const activeGoal = state.profile ? getActiveLearningGoal(state.profile) : undefined;
  const value = activeGoal?.metadata?.skippedFixedLessonIds;

  if (typeof value !== "string" || !value.trim()) {
    return new Set<string>();
  }

  return new Set(value.split(",").map((item) => item.trim()).filter(Boolean));
}

export function canManageCoursePlan(state: AppState) {
  const activeLearner = getActiveLearner(state);
  const activeGoal = state.profile ? getActiveLearningGoal(state.profile) : undefined;

  return (
    state.accountMode !== "child" &&
    activeLearner?.restrictions.learningOnly !== true &&
    activeLearner?.restrictions.canEditGoals !== false &&
    activeGoal?.managedByTeacher !== true
  );
}

export function buildEffectiveCoursePlan(state: AppState) {
  const activeGoal = state.profile ? getActiveLearningGoal(state.profile) : undefined;
  const usesFixedCourseTrack = hasFixedCourseTrack(activeGoal);
  const visiblePlans = getActiveGoalPlans(state.generatedPlans, activeGoal).filter((plan) => plan.status === "active" || plan.status === "completed");
  const replacementPlans = visiblePlans.filter((plan) => parseReplaceFixedFromDay(plan));
  const replacementStart = usesFixedCourseTrack
    ? replacementPlans
        .map(parseReplaceFixedFromDay)
        .filter((value): value is number => Boolean(value))
        .sort((a, b) => a - b)[0]
    : undefined;
  const skippedFixedLessonIds = getSkippedFixedLessonIds(state);

  const fixedLessons: EffectiveCourseLesson[] = usesFixedCourseTrack
    ? state.plan
        .filter((day) => !replacementStart || day.dayNumber < replacementStart)
        .map((day) => {
          const status: EffectiveCourseLessonStatus = skippedFixedLessonIds.has(day.lessonId)
            ? "skipped"
            : day.dayNumber < state.currentDay
              ? "completed"
              : day.dayNumber === state.currentDay
                ? "current"
                : "upcoming";

          return {
            key: `fixed-${day.lessonId}`,
            source: "fixed",
            lessonId: day.lessonId,
            dayNumber: day.dayNumber,
            title: day.title,
            objective: day.objective,
            status,
            completedAt: undefined,
            locked: status === "completed",
            href: `/study/lesson/${day.lessonId}`,
            relearnHref: status === "completed" ? `/study/review/extra?scope=lesson&lessonId=${encodeURIComponent(day.lessonId)}` : undefined,
            canReplan: status !== "completed",
            canJump: status === "upcoming",
          };
        })
    : [];

  const generatedLessons: EffectiveCourseLesson[] = visiblePlans.flatMap((plan) =>
    plan.days.map((day) => {
      const status: EffectiveCourseLessonStatus = day.completedAt
        ? "completed"
        : day.skippedAt
          ? "skipped"
        : plan.days.find((candidate) => !candidate.completedAt && !candidate.skippedAt)?.lessonId === day.lessonId
          ? "current"
          : "upcoming";

      return {
        key: `generated-${plan.id}-${day.lessonId}`,
        source: "generated",
        planId: plan.id,
        lessonId: day.lessonId,
        dayNumber: day.dayNumber,
        title: day.title,
        objective: day.objective,
        status,
        completedAt: day.completedAt,
        locked: status === "completed",
        href: `/study/generated/${plan.id}/${day.lessonId}`,
        relearnHref: status === "completed" ? `/study/review/extra?scope=lesson&lessonId=${encodeURIComponent(day.lessonId)}` : undefined,
        canReplan: status !== "completed",
        canJump: status === "upcoming",
      };
    }),
  );

  return {
    usesFixedCourseTrack,
    replacementStart,
    lessons: [...fixedLessons, ...generatedLessons].sort((a, b) => a.dayNumber - b.dayNumber),
    generatedPlans: visiblePlans.map<EffectiveGeneratedPlanSummary>((plan) => ({
      id: plan.id,
      title: plan.days[0]?.title ?? plan.subject,
      status: plan.status,
      completedCount: plan.days.filter((day) => day.completedAt).length,
      totalCount: plan.days.length,
    })),
  };
}

export function deriveReplanRecommendations(params: {
  state: AppState;
  performance: LearningPerformance;
  weakestType?: LearningType;
  lessonHotspots: Array<{ lessonId: string; lessonTitle: string; misses: number; missRate: number }>;
  locale: string;
}) {
  const isZh = params.locale === "zh-TW";
  const recommendations: ReplanRecommendation[] = [];
  const dueCount = params.state.reviewItems.filter((item) => new Date(item.dueDate).getTime() <= Date.now()).length;

  if (dueCount >= 6) {
    recommendations.push({
      kind: "review-first",
      title: isZh ? "先穩住到期複習" : "Stabilize due reviews first",
      body: isZh ? `目前有 ${dueCount} 個複習項目到期，建議先複習再推進新課。` : `${dueCount} review items are due. Review before adding new lessons.`,
      actionLabel: isZh ? "前往複習" : "Review now",
      href: "/study/review",
    });
  }

  if (params.weakestType && hasAttempts(params.performance, params.weakestType) && accuracy(params.performance, params.weakestType) < 0.7) {
    recommendations.push({
      kind: "reinforce-skill",
      title: isZh ? "插入一堂能力補強" : "Insert a skill reinforcement lesson",
      body: isZh ? "近期作答顯示有明顯弱項，未完成課程可先插入一堂短補強。" : "Recent answers show a weak skill. Add a short bridge lesson before continuing.",
      actionLabel: isZh ? "新增補強課" : "Add reinforcement",
    });
  }

  const hotspot = params.lessonHotspots.find((item) => item.misses >= 2 && item.missRate >= 0.4);
  if (hotspot) {
    recommendations.push({
      kind: "bridge-hotspot",
      title: isZh ? "針對卡住課程重學" : "Rework a lesson hotspot",
      body: isZh ? `${hotspot.lessonTitle} 的失誤率偏高，建議安排重學或補強。` : `${hotspot.lessonTitle} has a high miss rate. Schedule a relearn or bridge lesson.`,
      actionLabel: isZh ? "重新學習" : "Relearn",
      href: `/study/review/extra?scope=lesson&lessonId=${encodeURIComponent(hotspot.lessonId)}`,
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      kind: "keep-sequence",
      title: isZh ? "目前可以維持原順序" : "Keep the current sequence",
      body: isZh ? "目前資料沒有顯示需要大幅調整課程，建議照原路徑推進。" : "Current data does not require a major replan. Continue the planned sequence.",
      actionLabel: isZh ? "打開今日課程" : "Open today's lesson",
      href: "/study/today",
    });
  }

  return recommendations.slice(0, 3);
}
