import {
  deriveLearningTypeBreakdown,
  deriveLessonHotspots,
  deriveRetentionScore,
  deriveStats,
  getTodayLesson,
  readState,
} from "@/lib/store";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { LearningType, PracticeQuestion, ReviewLog, ReviewItem } from "@/lib/types";

interface DashboardSnapshot {
  profile: Awaited<ReturnType<typeof readState>>["profile"];
  stats: {
    dueCount: number;
    masteredCount: number;
    weakItems: ReviewItem[];
    streak: number;
    completedDays: number;
    planDays: number;
    totalReviews: number;
    formalReviews: number;
    extraReviews: number;
    diagnosticReviews: number;
  };
  retentionScore: number;
  planDay: Awaited<ReturnType<typeof getTodayLesson>>["planDay"];
  lesson: Awaited<ReturnType<typeof getTodayLesson>>["lesson"];
  unit: Awaited<ReturnType<typeof getTodayLesson>>["unit"];
  courseLesson: Awaited<ReturnType<typeof getTodayLesson>>["courseLesson"];
  recentLogs: ReviewLog[];
  learningTypeBreakdown: ReturnType<typeof deriveLearningTypeBreakdown>;
  lessonHotspots: ReturnType<typeof deriveLessonHotspots>;
}

type LearningTypeSummaryRow = {
  learning_type: string;
  attempts: number;
  accuracy: number;
};

type LessonHotspotRow = {
  lesson_id: string;
  attempts: number;
  misses: number;
  miss_rate: number;
};

async function readDashboardAggregatesFromViews(sessionId: string) {
  const client = getSupabaseAdminClient();

  if (!client) {
    return null;
  }

  try {
    const [learningTypeResult, hotspotResult] = await Promise.all([
      client
        .from("review_learning_type_summary")
        .select("learning_type, attempts, accuracy")
        .eq("session_id", sessionId),
      client
        .from("review_lesson_hotspots")
        .select("lesson_id, attempts, misses, miss_rate")
        .eq("session_id", sessionId)
        .order("miss_rate", { ascending: false })
        .order("misses", { ascending: false })
        .limit(3),
    ]);

    if (learningTypeResult.error || hotspotResult.error) {
      throw learningTypeResult.error ?? hotspotResult.error;
    }

    return {
      learningTypeRows: (learningTypeResult.data ?? []) as LearningTypeSummaryRow[],
      hotspotRows: (hotspotResult.data ?? []) as LessonHotspotRow[],
    };
  } catch {
    return null;
  }
}

function isLearningType(value: string): value is LearningType {
  return ["sentence-translation", "vocabulary", "listening", "speaking", "writing", "grammar"].includes(value);
}

export async function getDashboardSnapshot(sessionId: string): Promise<DashboardSnapshot> {
  const state = await readState(sessionId);
  const stats = deriveStats(state);
  const retentionScore = deriveRetentionScore(state);
  const { planDay, lesson, unit, courseLesson } = await getTodayLesson(sessionId);
  const viewAggregates = await readDashboardAggregatesFromViews(sessionId);
  const learningTypeBreakdown: DashboardSnapshot["learningTypeBreakdown"] = viewAggregates
    ? viewAggregates.learningTypeRows
        .flatMap((row) =>
          isLearningType(row.learning_type)
            ? [
                {
                  learningType: row.learning_type,
                  attempts: Number(row.attempts ?? 0),
                  accuracy: Number(row.accuracy ?? 0),
                },
              ]
            : [],
        )
        .sort((a, b) => a.accuracy - b.accuracy)
    : deriveLearningTypeBreakdown(state);
  const lessonHotspots: DashboardSnapshot["lessonHotspots"] = viewAggregates
    ? viewAggregates.hotspotRows.map((row) => ({
        lessonId: row.lesson_id,
        lessonTitle: state.plan.find((item) => item.lessonId === row.lesson_id)?.title ?? row.lesson_id,
        total: Number(row.attempts ?? 0),
        misses: Number(row.misses ?? 0),
        missRate: Number(row.miss_rate ?? 0),
      }))
    : deriveLessonHotspots(state);

  return {
    profile: state.profile,
    stats,
    retentionScore,
    planDay,
    lesson,
    unit,
    courseLesson,
    recentLogs: state.reviewLogs.slice(0, 5),
    learningTypeBreakdown,
    lessonHotspots
  };
}

function normalizeAnswer(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[.!?。！？,，、]/g, "")
    .replace(/\s+/g, " ");
}

function extractNumericValue(value: string) {
  const fraction = value.match(/(-?\d+)\s*\/\s*(-?\d+)/);

  if (fraction) {
    const numerator = Number(fraction[1]);
    const denominator = Number(fraction[2]);

    if (denominator !== 0) {
      return numerator / denominator;
    }
  }

  const numeric = value.match(/-?\d+(?:\.\d+)?/);
  return numeric ? Number(numeric[0]) : null;
}

function keywordOverlap(input: string, answer: string) {
  const tokenize = (value: string) =>
    normalizeAnswer(value)
      .split(/[\s，,。！？；;：:、]+/)
      .flatMap((token) => {
        if (/[\u4e00-\u9fff]/.test(token)) {
          return Array.from(token).filter((char) => /[\u4e00-\u9fff]/.test(char));
        }

        return token.length > 1 ? [token] : [];
      })
      .filter(Boolean);
  const expected = new Set(tokenize(answer));
  const actual = new Set(tokenize(input));

  if (expected.size === 0 || actual.size === 0) {
    return 0;
  }

  return [...expected].filter((token) => actual.has(token)).length / expected.size;
}

function looksLikeConceptualQuestion(question?: PracticeQuestion) {
  if (!question) {
    return false;
  }

  const text = `${question.prompt} ${question.answer} ${question.hint}`;
  return /已知|條件|要求|解題|策略|主旨|關鍵詞|閱讀|段落|題意/.test(text);
}

export function evaluatePracticeAnswer(
  input: string,
  answer: string,
  acceptableAnswers: string[] = [],
  question?: PracticeQuestion,
) {
  const normalizedInput = normalizeAnswer(input);
  const expected = [answer, ...acceptableAnswers].map((item) =>
    normalizeAnswer(item),
  );
  let isCorrect = expected.includes(normalizedInput);
  let feedbackMode: "exact" | "numeric" | "conceptual" | "close" = "exact";

  if (!isCorrect) {
    const inputNumber = extractNumericValue(input);
    const expectedNumbers = [answer, ...acceptableAnswers].map(extractNumericValue).filter((value): value is number => value !== null);

    if (inputNumber !== null && expectedNumbers.some((value) => Math.abs(value - inputNumber) < 0.000001)) {
      isCorrect = true;
      feedbackMode = "numeric";
    }
  }

  if (!isCorrect && looksLikeConceptualQuestion(question)) {
    const overlap = Math.max(...[answer, ...acceptableAnswers].map((candidate) => keywordOverlap(input, candidate)));

    if (overlap >= 0.45 || normalizeAnswer(input).length >= 8 && overlap >= 0.3) {
      isCorrect = true;
      feedbackMode = "conceptual";
    } else if (overlap > 0) {
      feedbackMode = "close";
    }
  }

  const feedback = isCorrect
    ? feedbackMode === "numeric"
      ? "數值正確。接著記得檢查單位、題意和計算過程。"
      : feedbackMode === "conceptual"
        ? "方向正確。你的答案抓到核心概念，接著可以再補得更完整。"
        : "很好。你有先回想再輸出，這比單純看答案更有效。"
    : feedbackMode === "close"
      ? `你已經抓到一部分重點。參考答案是「${answer}」，再補完整一點。`
      : `先抓核心重點。參考答案是「${answer}」。如果你的句子意思接近，請優先記住完整說法或解題步驟。`;

  return {
    isCorrect,
    feedback
  };
}
