import { getSupabaseAdminClient } from "@/lib/supabase";
import { LearningPerformance, LearningType } from "@/lib/types";

export const APP_PERFORMANCE_COOKIE = "openlearning_performance";

export const learningTypes: LearningType[] = [
  "sentence-translation",
  "vocabulary",
  "listening",
  "speaking",
  "writing",
  "grammar"
];

type LearningPerformanceRow = {
  learning_type: LearningType;
  attempts: number;
  correct_count: number;
};

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

export function normalizeLearningPerformance(rows: LearningPerformanceRow[]) {
  return rows.reduce<LearningPerformance>((acc, row) => {
    acc[row.learning_type] = {
      attempts: Number(row.attempts ?? 0),
      correct: Number(row.correct_count ?? 0)
    };
    return acc;
  }, {});
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

export async function readLearningPerformance(sessionId: string, fallbackCookieValue?: string | null) {
  const fallback = parseLearningPerformanceCookie(fallbackCookieValue);
  const client = getSupabaseAdminClient();

  if (!client) {
    return fallback;
  }

  try {
    const { data, error } = await client
      .from("learning_performance_stats")
      .select("learning_type, attempts, correct_count")
      .eq("session_id", sessionId);

    if (error) {
      throw error;
    }

    return normalizeLearningPerformance((data ?? []) as LearningPerformanceRow[]);
  } catch {
    return fallback;
  }
}

export async function persistLearningPerformance(sessionId: string, performance: LearningPerformance) {
  const client = getSupabaseAdminClient();

  if (!client) {
    return false;
  }

  const rows = learningTypes.map((learningType) => {
    const stat = performance[learningType] ?? { attempts: 0, correct: 0 };

    return {
      session_id: sessionId,
      learning_type: learningType,
      attempts: stat.attempts,
      correct_count: stat.correct,
      updated_at: new Date().toISOString()
    };
  });

  try {
    const { error } = await client
      .from("learning_performance_stats")
      .upsert(rows, { onConflict: "session_id,learning_type" });

    if (error) {
      throw error;
    }

    return true;
  } catch {
    return false;
  }
}

export async function recordLearningPerformance(params: {
  sessionId: string;
  learningType: LearningType;
  correct: boolean;
  fallbackCookieValue?: string | null;
}) {
  const currentPerformance = await readLearningPerformance(params.sessionId, params.fallbackCookieValue);
  const nextPerformance = updateLearningPerformance({
    performance: currentPerformance,
    learningType: params.learningType,
    correct: params.correct
  });

  await persistLearningPerformance(params.sessionId, nextPerformance);

  return nextPerformance;
}
