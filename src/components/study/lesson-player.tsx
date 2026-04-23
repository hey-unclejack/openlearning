"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { GeneratedPracticeStep } from "@/components/study/generated-practice-step";
import { LessonCompleteButton } from "@/components/study/lesson-complete-button";
import { StudySessionShell } from "@/components/study/study-session-shell";
import { AppLocale, getLocaleCopy } from "@/lib/i18n";
import { getWeakLearningTypes } from "@/lib/practice-performance";
import {
  LearningFocus,
  LearningPerformance,
  LearningType,
  LessonReviewSeed,
  PracticeQuestion,
  ProficiencyLevel
} from "@/lib/types";

function shuffle<T>(items: T[]) {
  const next = [...items];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
}

function pickBlankTarget(sentence: string) {
  const cleanedTokens = sentence.replace(/[.,!?]/g, "").split(/\s+/).filter(Boolean);
  return [...cleanedTokens].reverse().find((token) => token.length > 2) ?? cleanedTokens[cleanedTokens.length - 1] ?? "";
}

function buildDerivedPracticeQuestions(params: {
  reviewSeeds: LessonReviewSeed[];
  chunks: string[];
  vocabulary: string[];
  dialogue: string[];
}): PracticeQuestion[] {
  const { reviewSeeds, chunks, vocabulary, dialogue } = params;
  const shortSeeds = reviewSeeds.filter((seed) => seed.back.split(/\s+/).length <= 3);
  const longSeeds = reviewSeeds.filter((seed) => seed.back.split(/\s+/).length >= 3);

  const vocabularyQuestion = shortSeeds[0]
    ? {
        id: `${shortSeeds[0].id}-vocabulary`,
        learningType: "vocabulary" as const,
        prompt: shortSeeds[0].front,
        answer: shortSeeds[0].back,
        hint: shortSeeds[0].hint,
        meta: {
          options: shuffle(
            [
              shortSeeds[0].back,
              ...shortSeeds.filter((seed) => seed.id !== shortSeeds[0].id).map((seed) => seed.back),
              ...vocabulary.filter((item) => item !== shortSeeds[0].back)
            ].slice(0, 4),
          )
        }
      }
    : null;

  const grammarSource = longSeeds[0]?.back ?? chunks[0];
  const blankTarget = grammarSource ? pickBlankTarget(grammarSource) : "";
  const grammarQuestion =
    grammarSource && blankTarget
      ? {
          id: `grammar-${blankTarget}`,
          learningType: "grammar" as const,
          prompt: grammarSource,
          answer: blankTarget,
          hint: blankTarget,
          meta: {
            sourceText: grammarSource.replace(blankTarget, "____"),
            clozeTarget: blankTarget
          }
        }
      : null;

  const listeningSeed = longSeeds[1] ?? longSeeds[0];
  const listeningQuestion = listeningSeed
    ? {
        id: `${listeningSeed.id}-listening`,
        learningType: "listening" as const,
        prompt: listeningSeed.front,
        answer: listeningSeed.back,
        hint: listeningSeed.hint,
        acceptableAnswers: [listeningSeed.back],
        meta: {
          options: shuffle(
            [
              listeningSeed.back,
              ...longSeeds.filter((seed) => seed.id !== listeningSeed.id).map((seed) => seed.back),
              ...chunks.filter((item) => item !== listeningSeed.back)
            ].slice(0, 4),
          )
        }
      }
    : null;

  const speakingSource = chunks[0] ?? longSeeds[0]?.back;
  const speakingQuestion = speakingSource
    ? {
        id: `speaking-${speakingSource}`,
        learningType: "speaking" as const,
        prompt: speakingSource,
        answer: speakingSource,
        hint: speakingSource
      }
    : null;

  const writingSource = dialogue[dialogue.length - 1] ?? longSeeds[0]?.back ?? chunks[0];
  const writingQuestion = writingSource
    ? {
        id: `writing-${writingSource}`,
        learningType: "writing" as const,
        prompt: `用下列線索寫一句完整英文：${detectWritingPromptSource(writingSource)}`,
        answer: writingSource.replace(/^[A-Z]:\s*/, ""),
        hint: "先寫完整意思，再調整自然度。",
        meta: {
          referenceParts: [...vocabulary.slice(0, 2), ...chunks.slice(0, 1)].filter(Boolean),
        }
      }
    : null;

  const correctionTarget = longSeeds[0]?.back;
  const correctionQuestion = correctionTarget
    ? {
        id: `correction-${correctionTarget}`,
        learningType: "writing" as const,
        prompt: correctionTarget,
        answer: correctionTarget,
        hint: "找出不自然或錯誤的地方，改成正確句子。",
        meta: {
          incorrectText: correctionTarget
            .replace(/\bI'm\b/, "I am")
            .replace(/\bOur team\b/, "Our team are")
            .replace(/\bThis is\b/, "This are")
        }
      }
    : null;

  return [vocabularyQuestion, grammarQuestion, listeningQuestion, speakingQuestion, writingQuestion, correctionQuestion].filter(Boolean) as PracticeQuestion[];
}

function detectWritingPromptSource(value: string) {
  return value.replace(/^[A-Z]:\s*/, "");
}

function selectPracticePlan(params: {
  basePractice: PracticeQuestion[];
  derivedPractice: PracticeQuestion[];
  level?: ProficiencyLevel;
  focus?: LearningFocus;
  dailyMinutes?: number;
  performance?: LearningPerformance;
}) {
  const { basePractice, derivedPractice, level, focus, dailyMinutes = 15, performance } = params;
  const targetCount = dailyMinutes <= 10 ? 3 : dailyMinutes >= 30 ? 6 : 4;
  const chosen: PracticeQuestion[] = [];
  const usedIds = new Set<string>();
  const weakTypes = getWeakLearningTypes(performance ?? {});

  function pushQuestion(question?: PracticeQuestion) {
    if (!question || usedIds.has(question.id) || chosen.length >= targetCount) {
      return;
    }

    chosen.push(question);
    usedIds.add(question.id);
  }

  const byType = (questions: PracticeQuestion[], learningType: LearningType) =>
    questions.filter((question) => (question.learningType ?? "sentence-translation") === learningType);

  const baseTranslations = byType(basePractice, "sentence-translation");
  const derivedVocabulary = byType(derivedPractice, "vocabulary");
  const derivedGrammar = byType(derivedPractice, "grammar");
  const derivedListening = byType(derivedPractice, "listening");
  const derivedSpeaking = byType(derivedPractice, "speaking");
  const derivedWriting = byType(derivedPractice, "writing");

  pushQuestion(baseTranslations[0]);

  if (level === "A1" || level === "A2") {
    pushQuestion(derivedVocabulary[0]);
    pushQuestion(baseTranslations[1]);
    if (dailyMinutes >= 20) {
      pushQuestion(derivedSpeaking[0]);
    }
    if (dailyMinutes >= 30) {
      pushQuestion(derivedListening[0]);
    }
  } else {
    pushQuestion(derivedListening[0]);
    pushQuestion(baseTranslations[1]);
    pushQuestion(derivedSpeaking[0]);
    pushQuestion(derivedGrammar[0]);
    if (dailyMinutes >= 20) {
      pushQuestion(derivedWriting[0]);
    }
  }

  if (focus === "work") {
    pushQuestion(derivedSpeaking[0]);
    pushQuestion(derivedListening[0]);
    pushQuestion(derivedWriting[0]);
  } else if (focus === "travel") {
    pushQuestion(derivedListening[0]);
    pushQuestion(derivedVocabulary[0]);
  } else if (focus === "daily") {
    pushQuestion(derivedVocabulary[0]);
    pushQuestion(derivedSpeaking[0]);
  } else if (focus === "exam") {
    pushQuestion(derivedGrammar[0]);
    pushQuestion(baseTranslations[1]);
    pushQuestion(derivedWriting[1] ?? derivedWriting[0]);
  }

  [...basePractice, ...derivedPractice].forEach((question) => {
    pushQuestion(question);
  });

  weakTypes.forEach((learningType) => {
    const weakQuestion = [...derivedPractice, ...basePractice].find(
      (question) => (question.learningType ?? "sentence-translation") === learningType
    );
    pushQuestion(weakQuestion);
  });

  return chosen;
}

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
