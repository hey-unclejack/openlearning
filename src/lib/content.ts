import { deriveRetentionScore, deriveStats, getTodayLesson, readState } from "@/lib/store";
import { ReviewLog, ReviewItem } from "@/lib/types";

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
  };
  retentionScore: number;
  planDay: Awaited<ReturnType<typeof getTodayLesson>>["planDay"];
  recentLogs: ReviewLog[];
}

export async function getDashboardSnapshot(sessionId: string): Promise<DashboardSnapshot> {
  const state = await readState(sessionId);
  const stats = deriveStats(state);
  const retentionScore = deriveRetentionScore(state);
  const { planDay } = await getTodayLesson(sessionId);

  return {
    profile: state.profile,
    stats,
    retentionScore,
    planDay,
    recentLogs: state.reviewLogs.slice(0, 5)
  };
}

export function evaluatePracticeAnswer(input: string, answer: string, acceptableAnswers: string[] = []) {
  const normalizedInput = input.trim().toLowerCase().replace(/[.!?]/g, "");
  const expected = [answer, ...acceptableAnswers].map((item) =>
    item.trim().toLowerCase().replace(/[.!?]/g, ""),
  );
  const isCorrect = expected.includes(normalizedInput);

  const feedback = isCorrect
    ? "很好。你有先回想再輸出，這比單純看答案更有效。"
    : `先抓核心語塊。正解是 "${answer}"。如果你的句子意思接近，但不夠自然，請優先記住完整片語。`;

  return {
    isCorrect,
    feedback
  };
}
