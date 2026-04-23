import { LearningPerformance, LearningType } from "@/lib/types";

export const APP_PERFORMANCE_COOKIE = "openlearning_performance";

const learningTypes: LearningType[] = [
  "sentence-translation",
  "vocabulary",
  "listening",
  "speaking",
  "writing",
  "grammar"
];

export function parseLearningPerformanceCookie(value?: string | null): LearningPerformance {
  if (!value) {
    return {};
  }

  try {
    const decoded = decodeURIComponent(value);
    const parsed = JSON.parse(decoded) as Record<string, { attempts?: number; correct?: number }>;

    return learningTypes.reduce<LearningPerformance>((acc, learningType) => {
      const item = parsed[learningType];
      if (!item) {
        return acc;
      }

      acc[learningType] = {
        attempts: Number(item.attempts ?? 0),
        correct: Number(item.correct ?? 0)
      };
      return acc;
    }, {});
  } catch {
    return {};
  }
}

export function serializeLearningPerformanceCookie(performance: LearningPerformance) {
  return encodeURIComponent(JSON.stringify(performance));
}

export function updateLearningPerformance(params: {
  performance: LearningPerformance;
  learningType: LearningType;
  correct: boolean;
}) {
  const { performance, learningType, correct } = params;
  const current = performance[learningType] ?? { attempts: 0, correct: 0 };

  return {
    ...performance,
    [learningType]: {
      attempts: current.attempts + 1,
      correct: current.correct + (correct ? 1 : 0)
    }
  };
}

export function getWeakLearningTypes(performance: LearningPerformance) {
  return [...learningTypes]
    .map((learningType) => {
      const stat = performance[learningType];
      if (!stat || stat.attempts === 0) {
        return { learningType, score: 1 };
      }

      return {
        learningType,
        score: stat.correct / stat.attempts
      };
    })
    .sort((a, b) => a.score - b.score)
    .map((item) => item.learningType);
}

export function getLearningPerformanceRows(performance: LearningPerformance) {
  return learningTypes.map((learningType) => {
    const stat = performance[learningType] ?? { attempts: 0, correct: 0 };
    const accuracy = stat.attempts > 0 ? stat.correct / stat.attempts : 0;

    return {
      learningType,
      attempts: stat.attempts,
      correct: stat.correct,
      accuracy
    };
  });
}
