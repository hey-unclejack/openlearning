import { notFound } from "next/navigation";
import { LessonPlayer } from "@/components/study/lesson-player";
import { getLocale } from "@/lib/i18n-server";
import { getLearningPerformanceFromHeaders, getSessionIdFromHeaders } from "@/lib/session";
import { getGeneratedLesson } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function GeneratedLessonPage({
  params
}: {
  params: Promise<{ planId: string; lessonId: string }>;
}) {
  const { planId, lessonId } = await params;
  const [locale, sessionId, learningPerformance] = await Promise.all([
    getLocale(),
    getSessionIdFromHeaders(),
    getLearningPerformanceFromHeaders(),
  ]);
  const generated = await getGeneratedLesson(sessionId, planId, lessonId);

  if (!generated) {
    notFound();
  }

  const { plan, day } = generated;
  const nextDay = plan.days.find((item) => item.dayNumber === day.dayNumber + 1);
  const isZh = locale === "zh-TW";
  const subjectLabels: Record<string, string> = {
    language: isZh ? "語言" : "Language",
    "school-subject": isZh ? "學校科目" : "School subject",
    "exam-cert": isZh ? "考試 / 證照" : "Exam / certification",
    "self-study": isZh ? "自學內容" : "Self-study",
    math: isZh ? "數學" : "Math",
    chinese: isZh ? "國文" : "Mandarin",
    "mandarin-literacy": isZh ? "國文" : "Mandarin literacy",
    general: isZh ? "通用內容" : "General content",
  };
  const subjectLabel = subjectLabels[plan.subject] ?? (isZh ? "學習內容" : "Learning content");

  return (
    <LessonPlayer
      chunks={day.chunks}
      coachingNote={day.asset.coachingNote}
      dailyMinutes={plan.dailyMinutes}
      dayLabel={`AI Day ${day.dayNumber}`}
      dialogue={day.dialogue}
      exitHref="/ai"
      exitLabel={isZh ? "回到 AI 計劃" : "Back to AI plan"}
      focus={plan.focus}
      intro={day.asset.intro}
      isCurrentLesson={!day.completedAt}
      learningPerformance={learningPerformance}
      lessonId={day.lessonId}
      lessonTitle={day.title}
      locale={locale}
      nextLessonObjective={nextDay?.objective}
      nextLessonTitle={nextDay?.title}
      objective={day.objective}
      personalizationNote={day.asset.personalizationNote}
      practice={day.asset.practice}
      profileLevel={plan.level}
      reviewSeeds={day.asset.reviewSeeds}
      subject={plan.subject}
      unitLabel={`AI Generated Plan · ${subjectLabel}`}
      unitProgressText={`${day.dayNumber} / ${plan.days.length}`}
      unitSummary={
        isZh
          ? "你導入的內容已轉成短課、練習與間隔複習卡。"
          : "Your imported content is converted into short lessons, practice, and SRS review cards."
      }
      vocabulary={day.vocabulary}
    />
  );
}
