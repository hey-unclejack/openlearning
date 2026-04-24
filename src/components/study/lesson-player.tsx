"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { GeneratedPracticeStep } from "@/components/study/generated-practice-step";
import { LessonCompleteButton } from "@/components/study/lesson-complete-button";
import { StudySessionShell } from "@/components/study/study-session-shell";
import { AppLocale, getLocaleCopy } from "@/lib/i18n";
import { normalizeLearningDomain } from "@/lib/learning-goals";
import { buildDerivedPracticeQuestions, selectPracticePlan } from "@/lib/lesson-practice";
import {
  LearningFocus,
  LearningPerformance,
  LessonReviewSeed,
  PracticeQuestion,
  ProficiencyLevel,
  ReviewItem,
  SubjectArea
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

export function getSubjectLessonCopy(subject: SubjectArea, locale: AppLocale) {
  const isZh = locale === "zh-TW";

  if (subject === "math") {
    return {
      vocabularyEyebrow: isZh ? "概念" : "Concepts",
      vocabularyTitle: isZh ? "先抓住這題會用到的概念" : "Lock in the concepts this problem needs",
      vocabularyBody: isZh ? "先看懂條件、單位和關鍵詞，再開始列式。" : "Understand the conditions, units, and key terms before writing an equation.",
      chunksEyebrow: isZh ? "解題步驟" : "Problem-solving steps",
      chunksTitle: isZh ? "把解題流程拆成可重複使用的步驟" : "Turn the solution into repeatable steps",
      chunksBody: isZh ? "先讀題、再列式、最後檢查，避免直接猜答案。" : "Read, form the expression, then check instead of guessing.",
      dialogueEyebrow: isZh ? "引導對話" : "Guided walkthrough",
      dialogueTitle: isZh ? "看一次解題思路怎麼展開" : "See how the reasoning unfolds",
      practicePlanTitle: isZh ? "這堂數學課的練習編排" : "How this math practice is structured",
      practicePlanBody: isZh
        ? "系統會先練讀題和列式，再安排短答、填空或解題策略，完成後把概念排進複習。"
        : "The system starts with reading the problem and forming the expression, then adds short answers, blanks, or strategy checks before scheduling concepts into review.",
    };
  }

  if (subject === "chinese" || subject === "mandarin-literacy") {
    return {
      vocabularyEyebrow: isZh ? "關鍵詞" : "Key terms",
      vocabularyTitle: isZh ? "先抓住這段文字的關鍵詞" : "Lock in the key terms in this passage",
      vocabularyBody: isZh ? "關鍵詞會幫你判斷段落重點和主旨。" : "Key terms help you identify the paragraph focus and main idea.",
      chunksEyebrow: isZh ? "閱讀策略" : "Reading strategy",
      chunksTitle: isZh ? "把理解流程拆成可重複使用的步驟" : "Turn comprehension into repeatable steps",
      chunksBody: isZh ? "先找人事物，再抓關鍵詞，最後用自己的話整理主旨。" : "Find who/what/when first, then key terms, then summarize in your own words.",
      dialogueEyebrow: isZh ? "引導對話" : "Guided walkthrough",
      dialogueTitle: isZh ? "看一次閱讀理解怎麼整理" : "See how comprehension is organized",
      practicePlanTitle: isZh ? "這堂國文課的練習編排" : "How this Mandarin practice is structured",
      practicePlanBody: isZh
        ? "系統會先練關鍵詞和主旨，再安排改寫或短答，完成後把閱讀策略排進複習。"
        : "The system starts with key terms and main idea, then adds rewriting or short-answer checks before scheduling reading strategies into review.",
    };
  }

  return {
    vocabularyEyebrow: isZh ? "單字" : "Vocabulary",
    vocabularyTitle: isZh ? "先把今天會用到的單字抓穩" : "Lock in today's key vocabulary",
    vocabularyBody: isZh
      ? "先認得、先讀順，後面對話和練習才有支點。"
      : "Recognize and say these first so the dialogue and practice have something solid to build on.",
    chunksEyebrow: isZh ? "語塊" : "Chunks",
    chunksTitle: isZh ? "把整段語塊記成可直接使用的片段" : "Treat these chunks as ready-to-use phrases",
    chunksBody: isZh
      ? "比起逐字翻譯，先記住整段片語會更容易真正開口。"
      : "Memorizing the full phrase is more useful here than translating word by word.",
    dialogueEyebrow: isZh ? "對話" : "Dialogue",
    dialogueTitle: isZh ? "看一次完整對話怎麼落地" : "See how it lands in a full dialogue",
    practicePlanTitle: isZh ? "這堂課的練習編排" : "How this lesson's practice is structured",
    practicePlanBody: isZh
      ? "系統會先保留核心翻譯，再依你的程度、每日時間和學習目標插入單字、語法、聽力或口說。"
      : "The system keeps the core translation task first, then layers in vocabulary, grammar, listening, or speaking based on your level, daily time, and goal.",
  };
}

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
  warmupItems,
  dailyMinutes,
  focus,
  learningPerformance,
  subject = "language",
  exitHref = "/study/today",
  exitLabel
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
  warmupItems?: ReviewItem[];
  dailyMinutes?: number;
  focus?: LearningFocus;
  learningPerformance?: LearningPerformance;
  subject?: SubjectArea;
  exitHref?: string;
  exitLabel?: string;
}) {
  const copy = getLocaleCopy(locale);
  const [stepIndex, setStepIndex] = useState(0);
  const domain = normalizeLearningDomain(subject);
  const subjectCopy = getSubjectLessonCopy(subject, locale);
  const practiceContextWords = useMemo(() => [...vocabulary, ...chunks], [chunks, vocabulary]);
  const derivedPractice = useMemo(
    () => domain === "language" ? buildDerivedPracticeQuestions({ reviewSeeds, chunks, vocabulary, dialogue }) : [],
    [chunks, dialogue, domain, reviewSeeds, vocabulary],
  );
  const warmupPractice = useMemo(
    () =>
      (warmupItems ?? []).map(
        (item, index): PracticeQuestion => ({
          id: `warmup-${item.id}`,
          learningType: item.learningType,
          prompt: item.front,
          answer: item.back,
          hint: item.hint,
          acceptableAnswers: [item.back],
          meta: {
            sourceText: item.front,
          },
        }),
      ),
    [warmupItems],
  );
  const allPractice = useMemo(
    () =>
      selectPracticePlan({
        basePractice: practice,
        derivedPractice,
        level: profileLevel,
        focus,
        dailyMinutes,
        performance: learningPerformance,
        domain
      }),
    [dailyMinutes, derivedPractice, domain, focus, learningPerformance, practice, profileLevel],
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
        eyebrow: subjectCopy.vocabularyEyebrow,
        title: subjectCopy.vocabularyTitle,
        items: vocabulary,
        variant: "chips",
        support: subjectCopy.vocabularyBody
      },
      {
        type: "list",
        id: "chunks",
        eyebrow: subjectCopy.chunksEyebrow,
        title: subjectCopy.chunksTitle,
        items: chunks,
        variant: "stack",
        support: subjectCopy.chunksBody
      },
      {
        type: "dialogue",
        id: "dialogue",
        eyebrow: subjectCopy.dialogueEyebrow,
        title: subjectCopy.dialogueTitle,
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
        title: subjectCopy.practicePlanTitle,
        body: subjectCopy.practicePlanBody
      },
      ...warmupPractice.map(
        (question, index): LessonPlayerStep => ({
          type: "practice",
          id: `warmup-${question.id}`,
          eyebrow: copy.lesson.warmupEyebrow,
          title: copy.lesson.warmupTitle(index + 1),
          question
        }),
      ),
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
      subjectCopy,
      allPractice,
      warmupPractice,
      unitProgressText,
      unitSummary,
      vocabulary
    ],
  );

  const currentStep = steps[stepIndex] ?? steps[0];

  return (
    <StudySessionShell
      description={dayLabel}
      exitHref={exitHref}
      exitLabel={exitLabel ?? copy.lesson.backToToday}
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
              <>
                <Link className="button" href={`/study/review/extra?scope=lesson&lessonId=${lessonId}`}>
                  {copy.lesson.extraReviewLesson}
                </Link>
                <Link className="button-secondary" href="/study/today">
                  {copy.lesson.backToToday}
                </Link>
              </>
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
