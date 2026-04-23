"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { GeneratedPracticeStep } from "@/components/study/generated-practice-step";
import { LessonCompleteButton } from "@/components/study/lesson-complete-button";
import { StudySessionShell } from "@/components/study/study-session-shell";
import { AppLocale, getLocaleCopy } from "@/lib/i18n";
import { buildDerivedPracticeQuestions, selectPracticePlan } from "@/lib/lesson-practice";
import {
  LearningFocus,
  LearningPerformance,
  LessonReviewSeed,
  PracticeQuestion,
  ProficiencyLevel
} from "@/lib/types";

type LessonPlayerStep =
  | {
      type: "intro";
      id: string;
      eyebrow: string;
      title: string;
      body: string;
      support?: string[];
    }
  | {
      type: "list";
      id: string;
      eyebrow: string;
      title: string;
      items: string[];
      variant: "chips" | "stack";
      support?: string;
    }
  | {
      type: "dialogue";
      id: string;
      eyebrow: string;
      title: string;
      lines: string[];
    }
  | {
      type: "practice";
      id: string;
      eyebrow: string;
      title: string;
      question: PracticeQuestion;
    }
  | {
      type: "complete";
      id: string;
      eyebrow: string;
      title: string;
      body: string;
      support?: string[];
    };

export function LessonPlayer({
  locale,
  lessonId,
  unitLabel,
  dayLabel,
  lessonTitle,
  objective,
  intro,
  unitSummary,
  personalizationNote,
  vocabulary,
  chunks,
  dialogue,
  coachingNote,
  practice,
  isCurrentLesson,
  unitProgressText,
  nextLessonTitle,
  nextLessonObjective,
  profileLevel,
  reviewSeeds,
  dailyMinutes,
  focus,
  learningPerformance
}: {
  locale: AppLocale;
  lessonId: string;
  unitLabel: string;
  dayLabel: string;
  lessonTitle: string;
  objective: string;
  intro: string;
  unitSummary?: string;
  personalizationNote: string;
  vocabulary: string[];
  chunks: string[];
  dialogue: string[];
  coachingNote: string;
  practice: PracticeQuestion[];
  isCurrentLesson: boolean;
  unitProgressText: string;
  nextLessonTitle?: string;
  nextLessonObjective?: string;
  profileLevel?: ProficiencyLevel;
  reviewSeeds: LessonReviewSeed[];
  dailyMinutes?: number;
  focus?: LearningFocus;
  learningPerformance?: LearningPerformance;
}) {
  const copy = getLocaleCopy(locale);
  const [stepIndex, setStepIndex] = useState(0);
  const practiceContextWords = useMemo(() => [...vocabulary, ...chunks], [chunks, vocabulary]);
  const derivedPractice = useMemo(
    () => buildDerivedPracticeQuestions({ reviewSeeds, chunks, vocabulary, dialogue }),
    [chunks, dialogue, reviewSeeds, vocabulary],
  );
  const allPractice = useMemo(
    () =>
      selectPracticePlan({
        basePractice: practice,
        derivedPractice,
        level: profileLevel,
        focus,
        dailyMinutes,
        performance: learningPerformance
      }),
    [dailyMinutes, derivedPractice, focus, learningPerformance, practice, profileLevel],
  );

  const steps = useMemo<LessonPlayerStep[]>(
    () => [
      {
        type: "intro",
        id: "intro",
        eyebrow: copy.lesson.todayObjective,
        title: objective,
        body: intro,
        support: [unitSummary, personalizationNote, unitProgressText].filter(Boolean) as string[]
      },
      {
        type: "list",
        id: "vocabulary",
        eyebrow: copy.lesson.vocabulary,
        title: copy.lesson.vocabularyTitle,
        items: vocabulary,
        variant: "chips",
        support: copy.lesson.vocabularyBody
      },
      {
        type: "list",
        id: "chunks",
        eyebrow: copy.lesson.chunks,
        title: copy.lesson.chunksTitle,
        items: chunks,
        variant: "stack",
        support: copy.lesson.chunksBody
      },
      {
        type: "dialogue",
        id: "dialogue",
        eyebrow: copy.lesson.dialogue,
        title: copy.lesson.dialogueTitle,
        lines: dialogue
      },
      {
        type: "intro",
        id: "coach-note",
        eyebrow: copy.lesson.coachNote,
        title: copy.lesson.coachNoteTitle,
        body: coachingNote
      },
      {
        type: "intro",
        id: "practice-plan",
        eyebrow: copy.lesson.practice,
        title: copy.lesson.practicePlanTitle,
        body: copy.lesson.practicePlanBody
      },
      ...allPractice.map(
        (question, index): LessonPlayerStep => ({
          type: "practice",
          id: `practice-${question.id}`,
          eyebrow: copy.lesson.practice,
          title: copy.lesson.practiceQuestionStepTitle(index + 1),
          question
        }),
      ),
      {
        type: "complete",
        id: "complete",
        eyebrow: copy.lesson.nextStep,
        title: isCurrentLesson ? copy.lesson.completeStepTitle : copy.lesson.reviewOnlyTitle,
        body: isCurrentLesson ? copy.lesson.completeBody : copy.lesson.reviewOnlyBody,
        support: nextLessonTitle
          ? [copy.lesson.nextLessonPreview(nextLessonTitle), nextLessonObjective ?? ""].filter(Boolean)
          : undefined
      }
    ],
    [
      chunks,
      coachingNote,
      copy.lesson,
      dialogue,
      intro,
      isCurrentLesson,
      nextLessonObjective,
      nextLessonTitle,
      objective,
      personalizationNote,
      allPractice,
      unitProgressText,
      unitSummary,
      vocabulary
    ],
  );

  const currentStep = steps[stepIndex] ?? steps[0];

  return (
    <StudySessionShell
      description={dayLabel}
      exitHref="/study/today"
      exitLabel={copy.lesson.backToToday}
      eyebrow={unitLabel}
      progressCurrent={stepIndex + 1}
      progressLabel={copy.lesson.progressLabel(stepIndex + 1, steps.length)}
      progressTotal={steps.length}
      title={lessonTitle}
    >
      <div className="study-topic-card">
        {currentStep.type === "intro" ? (
          <div className="study-topic-stack">
            <div className="eyebrow">{currentStep.eyebrow}</div>
            <h2 className="study-topic-title">{currentStep.title}</h2>
            <p className="study-topic-body">{currentStep.body}</p>
            {currentStep.support?.length ? (
              <div className="study-topic-support-list">
                {currentStep.support.map((item) => (
                  <div key={item} className="study-topic-support">
                    {item}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {currentStep.type === "list" ? (
          <div className="study-topic-stack">
            <div className="eyebrow">{currentStep.eyebrow}</div>
            <h2 className="study-topic-title">{currentStep.title}</h2>
            {currentStep.support ? <p className="study-topic-body">{currentStep.support}</p> : null}
            <ul className={currentStep.variant === "chips" ? "study-topic-chip-list" : "study-topic-stack-list"}>
              {currentStep.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {currentStep.type === "dialogue" ? (
          <div className="study-topic-stack">
            <div className="eyebrow">{currentStep.eyebrow}</div>
            <h2 className="study-topic-title">{currentStep.title}</h2>
            <ul className="study-topic-dialogue-list">
              {currentStep.lines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {currentStep.type === "practice" ? (
          <GeneratedPracticeStep
            contextWords={practiceContextWords}
            level={profileLevel}
            locale={locale}
            question={currentStep.question}
          />
        ) : null}

        {currentStep.type === "complete" ? (
          <div className="study-topic-stack">
            <div className="eyebrow">{currentStep.eyebrow}</div>
            <h2 className="study-topic-title">{currentStep.title}</h2>
            <p className="study-topic-body">{currentStep.body}</p>
            {currentStep.support?.length ? (
              <div className="study-topic-support-list">
                {currentStep.support.map((item) => (
                  <div key={item} className="study-topic-support">
                    {item}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="study-topic-actions">
          <button
            className="ghost-button"
            disabled={stepIndex === 0}
            onClick={() => setStepIndex((value) => Math.max(0, value - 1))}
            type="button"
          >
            {copy.lesson.previousTopic}
          </button>
          {currentStep.type === "complete" ? (
            isCurrentLesson ? (
              <LessonCompleteButton lessonId={lessonId} locale={locale} />
            ) : (
              <Link className="button" href="/study/today">
                {copy.lesson.backToToday}
              </Link>
            )
          ) : (
            <button
              className="button"
              onClick={() => setStepIndex((value) => Math.min(steps.length - 1, value + 1))}
              type="button"
            >
              {copy.lesson.nextTopic}
            </button>
          )}
        </div>
      </div>
    </StudySessionShell>
  );
}
