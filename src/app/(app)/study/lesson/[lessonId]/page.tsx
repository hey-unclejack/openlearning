import Link from "next/link";
import { notFound } from "next/navigation";
import { LessonPlayer } from "@/components/study/lesson-player";
import { getLocaleCopy } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { readState } from "@/lib/store";
import { getLearningPerformanceFromHeaders, getSessionIdFromHeaders } from "@/lib/session";

export default async function LessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const sessionId = await getSessionIdFromHeaders();
  const learningPerformance = await getLearningPerformanceFromHeaders();
  const state = await readState(sessionId);
  const planDay = state.plan.find((item) => item.lessonId === lessonId || item.id === lessonId);
  const lesson = planDay ? state.lessons[planDay.lessonId] : undefined;
  const unit = planDay ? state.courseTrack.units.find((item) => item.id === planDay.unitId) : undefined;
  const locale = await getLocale();
  const copy = getLocaleCopy(locale);
  const currentPlanDay = state.plan.find((item) => item.dayNumber === state.currentDay) ?? state.plan[0];
  const isCurrentLesson = currentPlanDay?.lessonId === planDay?.lessonId;
  const unitLessons = unit?.lessons ?? [];
  const currentIndex = unitLessons.findIndex((item) => item.id === planDay?.lessonId);
  const nextLesson = currentIndex >= 0 ? unitLessons[currentIndex + 1] : undefined;
  const completedInUnit = currentIndex >= 0 ? currentIndex : 0;

  if (!lesson || !planDay) {
    notFound();
  }

  return (
    <LessonPlayer
      chunks={planDay.chunks}
      coachingNote={lesson.coachingNote}
      dayLabel={copy.lesson.dayLabel(planDay.dayNumber)}
      dialogue={planDay.dialogue}
      intro={lesson.intro}
      isCurrentLesson={isCurrentLesson}
      lessonId={planDay.lessonId}
      lessonTitle={planDay.title}
      locale={locale}
      nextLessonObjective={nextLesson?.objective}
      nextLessonTitle={nextLesson?.title}
      objective={planDay.objective}
      personalizationNote={lesson.personalizationNote}
      practice={lesson.practice}
      profileLevel={state.profile?.level}
      reviewSeeds={lesson.reviewSeeds}
      dailyMinutes={state.profile?.dailyMinutes}
      focus={state.profile?.focus}
      learningPerformance={learningPerformance}
      unitLabel={copy.lesson.unitLabel(planDay.unitNumber, planDay.unitTitle)}
      unitProgressText={copy.lesson.unitProgress(completedInUnit, unitLessons.length)}
      unitSummary={unit?.summary}
      vocabulary={planDay.vocabulary}
    />
  );
}
