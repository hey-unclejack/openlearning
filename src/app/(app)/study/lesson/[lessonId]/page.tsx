import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { LessonCompleteButton } from "@/components/study/lesson-complete-button";
import { PracticeTrainer } from "@/components/study/practice-trainer";
import { getLocaleCopy } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { readState } from "@/lib/store";
import { getCurrentUser, getSessionIdFromHeaders } from "@/lib/session";

export default async function LessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const sessionId = await getSessionIdFromHeaders();
  const user = await getCurrentUser();
  const state = await readState(sessionId);
  const planDay = state.plan.find((item) => item.lessonId === lessonId || item.id === lessonId);
  const lesson = planDay ? state.lessons[planDay.lessonId] : undefined;
  const locale = await getLocale();
  const copy = getLocaleCopy(locale);
  const currentPlanDay = state.plan.find((item) => item.dayNumber === state.currentDay) ?? state.plan[0];
  const isCurrentLesson = currentPlanDay?.lessonId === planDay?.lessonId;

  if (!lesson || !planDay) {
    notFound();
  }

  return (
    <AppShell activePath="/study/today" locale={locale} userEmail={user?.email}>
      <section className="stack lesson-page">
        <div className="panel-header">
          <div>
            <div className="eyebrow">
              {copy.lesson.unitLabel(planDay.unitNumber, planDay.unitTitle)}
            </div>
            <h1 className="page-title">{planDay.title}</h1>
            <p className="lede">{planDay.objective}</p>
          </div>
        </div>

        <div className="lesson-hero-grid">
          <div className="review-card lesson-hero-card">
            <div className="lesson-meta-row">
              <span className="pill">{copy.lesson.dayLabel(planDay.dayNumber)}</span>
              <span className="pill lesson-meta-pill-secondary">{copy.lesson.lessonFocus}</span>
            </div>
            <div className="stack lesson-copy-stack">
              <div className="eyebrow">{copy.lesson.todayObjective}</div>
              <p className="lesson-objective">{planDay.objective}</p>
            </div>
            <div className="stack lesson-copy-stack">
              <div className="eyebrow">{copy.lesson.lessonIntro}</div>
              <p className="subtle">{lesson.intro}</p>
            </div>
          </div>
          <div className="review-card lesson-hero-card lesson-hero-card-soft">
            <div className="eyebrow">{copy.lesson.studyFlow}</div>
            <ol className="lesson-flow-list">
              <li>{copy.lesson.flowAbsorb}</li>
              <li>{copy.lesson.flowRecall}</li>
              <li>{copy.lesson.flowComplete}</li>
            </ol>
          </div>
        </div>

        <div className="lesson-grid lesson-content-grid">
          <div className="review-card lesson-block">
            <h3 className="section-title">{copy.lesson.vocabulary}</h3>
            <ul className="lesson-chip-list">
              {planDay.vocabulary.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="review-card lesson-block">
            <h3 className="section-title">{copy.lesson.chunks}</h3>
            <ul className="lesson-chunk-list">
              {planDay.chunks.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="review-card lesson-block">
          <div className="eyebrow">{copy.lesson.dialogue}</div>
          <ul className="dialogue-list">
            {planDay.dialogue.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>

        <div className="review-card lesson-block lesson-note-card">
          <div className="eyebrow">{copy.lesson.coachNote}</div>
          <p className="lesson-note-body">{lesson.coachingNote}</p>
        </div>

        <PracticeTrainer locale={locale} questions={lesson.practice} />

        <div className="review-card lesson-block">
          <div className="eyebrow">{copy.lesson.nextStep}</div>
          <p className="subtle">
            {isCurrentLesson ? copy.lesson.completeBody : copy.lesson.reviewOnlyBody}
          </p>
          <div className="button-row">
            {isCurrentLesson ? (
              <LessonCompleteButton lessonId={planDay.lessonId} locale={locale} />
            ) : (
              <Link className="button-secondary" href="/study/today">
                {copy.lesson.backToToday}
              </Link>
            )}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
