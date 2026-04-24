import { getWeakLearningTypes } from "@/lib/practice-performance";
import { legacyLearningTypeForSkill, normalizeSkillDimension } from "@/lib/learning-goals";
import {
  LearningDomain,
  LearningFocus,
  LearningPerformance,
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

function detectWritingPromptSource(value: string) {
  return value.replace(/^[A-Z]:\s*/, "");
}

export function buildDerivedPracticeQuestions(params: {
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
          referenceParts: [...vocabulary.slice(0, 2), ...chunks.slice(0, 1)].filter(Boolean)
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

export function selectPracticePlan(params: {
  basePractice: PracticeQuestion[];
  derivedPractice: PracticeQuestion[];
  level?: ProficiencyLevel;
  focus?: LearningFocus;
  dailyMinutes?: number;
  performance?: LearningPerformance;
  domain?: LearningDomain;
}) {
  const { basePractice, derivedPractice, level, focus, dailyMinutes = 15, performance, domain = "language" } = params;
  const targetCount = dailyMinutes <= 10 ? 3 : dailyMinutes >= 30 ? 6 : 4;
  const chosen: PracticeQuestion[] = [];
  const usedIds = new Set<string>();
  const weakTypes = getWeakLearningTypes(performance ?? {}, domain);

  function pushQuestion(question?: PracticeQuestion) {
    if (!question || usedIds.has(question.id) || chosen.length >= targetCount) {
      return;
    }

    chosen.push(question);
    usedIds.add(question.id);
  }

  const byType = (questions: PracticeQuestion[], learningType: PracticeQuestion["learningType"]) =>
    questions.filter((question) => normalizeSkillDimension(question.skillDimension ?? question.learningType, domain) === learningType);

  const baseTranslations = byType(basePractice, "translation");
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
      (question) => normalizeSkillDimension(question.skillDimension ?? question.learningType, domain) === learningType
    );
    pushQuestion(weakQuestion);
  });

  return chosen;
}

export function getPracticeLearningTypes(questions: PracticeQuestion[]) {
  return [...new Set(questions.map((question) => question.skillDimension ?? question.learningType ?? "translation").map(legacyLearningTypeForSkill))];
}
