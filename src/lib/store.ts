import { cache } from "react";
import { createInitialState } from "@/lib/data/seed";
import { updateReviewItem } from "@/lib/srs";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { AppState, LearnerProfile, ReviewGrade, ReviewItem } from "@/lib/types";

declare global {
  // eslint-disable-next-line no-var
  var __openLearningStateMap: Map<string, AppState> | undefined;
}

type ProfileRow = {
  session_id: string;
  onboarded: boolean;
  streak: number;
  current_day: number;
  target_language: string;
  native_language: string;
  level: LearnerProfile["level"];
  daily_minutes: number;
  focus: string;
};

type PlanRow = {
  day_id: string;
  day_number: number;
  title: string;
  objective: string;
  vocabulary: string[];
  chunks: string[];
  dialogue: string[];
};

type LessonRow = {
  lesson_id: string;
  day_id: string;
  intro: string;
  coaching_note: string;
  practice: AppState["lessons"][string]["practice"];
};

type ReviewItemRow = {
  review_item_id: string;
  front: string;
  back: string;
  hint: string;
  tags: string[];
  ease_factor: number;
  interval_days: number;
  repetition_count: number;
  lapse_count: number;
  due_date: string;
  last_reviewed_at: string | null;
};

type ReviewLogRow = {
  review_item_id: string;
  grade: ReviewGrade;
  reviewed_at: string;
  next_due_date: string;
};

function getLocalStateMap() {
  if (!global.__openLearningStateMap) {
    global.__openLearningStateMap = new Map<string, AppState>();
  }

  return global.__openLearningStateMap;
}

function getLocalState(sessionId: string) {
  const stateMap = getLocalStateMap();

  if (!stateMap.has(sessionId)) {
    stateMap.set(sessionId, createInitialState());
  }

  return stateMap.get(sessionId)!;
}

function profileToRow(sessionId: string, state: AppState): ProfileRow {
  const profile = state.profile ?? createInitialState().profile!;

  return {
    session_id: sessionId,
    onboarded: state.onboarded,
    streak: state.streak,
    current_day: state.currentDay,
    target_language: profile.targetLanguage,
    native_language: profile.nativeLanguage,
    level: profile.level,
    daily_minutes: profile.dailyMinutes,
    focus: profile.focus
  };
}

function mapSupabaseState(
  profile: ProfileRow,
  planRows: PlanRow[],
  lessonRows: LessonRow[],
  reviewItemRows: ReviewItemRow[],
  reviewLogRows: ReviewLogRow[],
): AppState {
  const lessons = Object.fromEntries(
    lessonRows.map((row) => [
      row.lesson_id,
      {
        id: row.lesson_id,
        dayId: row.day_id,
        intro: row.intro,
        coachingNote: row.coaching_note,
        practice: row.practice
      }
    ]),
  );

  return {
    onboarded: profile.onboarded,
    streak: profile.streak,
    currentDay: profile.current_day,
    profile: {
      targetLanguage: profile.target_language,
      nativeLanguage: profile.native_language,
      level: profile.level,
      dailyMinutes: profile.daily_minutes,
      focus: profile.focus
    },
    plan: planRows.map((row) => ({
      id: row.day_id,
      dayNumber: row.day_number,
      title: row.title,
      objective: row.objective,
      vocabulary: row.vocabulary,
      chunks: row.chunks,
      dialogue: row.dialogue
    })),
    lessons,
    reviewItems: reviewItemRows.map((row) => ({
      id: row.review_item_id,
      front: row.front,
      back: row.back,
      hint: row.hint,
      tags: row.tags,
      easeFactor: row.ease_factor,
      intervalDays: row.interval_days,
      repetitionCount: row.repetition_count,
      lapseCount: row.lapse_count,
      dueDate: row.due_date,
      lastReviewedAt: row.last_reviewed_at ?? undefined
    })),
    reviewLogs: reviewLogRows.map((row) => ({
      itemId: row.review_item_id,
      grade: row.grade,
      reviewedAt: row.reviewed_at,
      nextDueDate: row.next_due_date
    }))
  };
}

async function seedSupabaseSession(sessionId: string) {
  const client = getSupabaseAdminClient();

  if (!client) {
    return;
  }

  const seed = createInitialState();
  const profileRow = profileToRow(sessionId, seed);
  const planRows = seed.plan.map((item) => ({
    session_id: sessionId,
    day_id: item.id,
    day_number: item.dayNumber,
    title: item.title,
    objective: item.objective,
    vocabulary: item.vocabulary,
    chunks: item.chunks,
    dialogue: item.dialogue
  }));
  const lessonRows = Object.values(seed.lessons).map((lesson) => ({
    session_id: sessionId,
    lesson_id: lesson.id,
    day_id: lesson.dayId,
    intro: lesson.intro,
    coaching_note: lesson.coachingNote,
    practice: lesson.practice
  }));
  const reviewRows = seed.reviewItems.map((item) => ({
    session_id: sessionId,
    review_item_id: item.id,
    front: item.front,
    back: item.back,
    hint: item.hint,
    tags: item.tags,
    ease_factor: item.easeFactor,
    interval_days: item.intervalDays,
    repetition_count: item.repetitionCount,
    lapse_count: item.lapseCount,
    due_date: item.dueDate,
    last_reviewed_at: item.lastReviewedAt ?? null
  }));

  await client.from("learner_profiles").upsert(profileRow, { onConflict: "session_id" });
  await client.from("study_plan_days").upsert(planRows, { onConflict: "session_id,day_id" });
  await client.from("lessons").upsert(lessonRows, { onConflict: "session_id,lesson_id" });
  await client.from("review_items").upsert(reviewRows, { onConflict: "session_id,review_item_id" });
}

async function ensureSupabaseState(sessionId: string) {
  const client = getSupabaseAdminClient();

  if (!client) {
    return null;
  }

  const { data: existingProfile } = await client
    .from("learner_profiles")
    .select("session_id")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (!existingProfile) {
    await seedSupabaseSession(sessionId);
  }

  return client;
}

async function fetchStateFromSupabase(sessionId: string): Promise<AppState | null> {
  const client = await ensureSupabaseState(sessionId);

  if (!client) {
    return null;
  }

  const [
    profileResult,
    planResult,
    lessonResult,
    reviewItemsResult,
    reviewLogsResult
  ] = await Promise.all([
    client.from("learner_profiles").select("*").eq("session_id", sessionId).single(),
    client.from("study_plan_days").select("*").eq("session_id", sessionId).order("day_number"),
    client.from("lessons").select("*").eq("session_id", sessionId),
    client.from("review_items").select("*").eq("session_id", sessionId),
    client.from("review_logs").select("*").eq("session_id", sessionId).order("reviewed_at", { ascending: false }).limit(20)
  ]);

  if (profileResult.error || planResult.error || lessonResult.error || reviewItemsResult.error || reviewLogsResult.error) {
    throw new Error("Failed to load learner state from Supabase");
  }

  return mapSupabaseState(
    profileResult.data as unknown as ProfileRow,
    planResult.data as unknown as PlanRow[],
    lessonResult.data as unknown as LessonRow[],
    reviewItemsResult.data as unknown as ReviewItemRow[],
    reviewLogsResult.data as unknown as ReviewLogRow[],
  );
}

const getCachedSupabaseState = cache(fetchStateFromSupabase);

export async function readState(sessionId: string) {
  try {
    const supabaseState = await getCachedSupabaseState(sessionId);

    if (supabaseState) {
      return supabaseState;
    }
  } catch {
    return getLocalState(sessionId);
  }

  return getLocalState(sessionId);
}

export async function saveProfile(sessionId: string, profile: LearnerProfile) {
  const client = getSupabaseAdminClient();

  if (!client) {
    const state = getLocalState(sessionId);
    state.profile = profile;
    state.onboarded = true;
    return;
  }

  try {
    await ensureSupabaseState(sessionId);
    await client
      .from("learner_profiles")
      .update({
        target_language: profile.targetLanguage,
        native_language: profile.nativeLanguage,
        level: profile.level,
        daily_minutes: profile.dailyMinutes,
        focus: profile.focus,
        onboarded: true
      })
      .eq("session_id", sessionId);
  } catch {
    const state = getLocalState(sessionId);
    state.profile = profile;
    state.onboarded = true;
  }
}

export async function getTodayLesson(sessionId: string) {
  const state = await readState(sessionId);
  const planDay = state.plan.find((item) => item.dayNumber === state.currentDay) ?? state.plan[0];
  const lesson = state.lessons[`lesson-${planDay.id}`];

  return { planDay, lesson };
}

export async function getDueReviewItems(sessionId: string) {
  const client = getSupabaseAdminClient();

  if (!client) {
    const now = Date.now();
    return getLocalState(sessionId).reviewItems.filter((item) => new Date(item.dueDate).getTime() <= now);
  }

  try {
    await ensureSupabaseState(sessionId);

    const { data, error } = await client
      .from("review_items")
      .select("*")
      .eq("session_id", sessionId)
      .lte("due_date", new Date().toISOString())
      .order("due_date");

    if (error) {
      throw new Error("Failed to fetch due review items");
    }

    return (data as unknown as ReviewItemRow[]).map((row) => ({
      id: row.review_item_id,
      front: row.front,
      back: row.back,
      hint: row.hint,
      tags: row.tags,
      easeFactor: row.ease_factor,
      intervalDays: row.interval_days,
      repetitionCount: row.repetition_count,
      lapseCount: row.lapse_count,
      dueDate: row.due_date,
      lastReviewedAt: row.last_reviewed_at ?? undefined
    }));
  } catch {
    const now = Date.now();
    return getLocalState(sessionId).reviewItems.filter((item) => new Date(item.dueDate).getTime() <= now);
  }
}

export async function reviewItem(sessionId: string, itemId: string, grade: ReviewGrade) {
  const client = getSupabaseAdminClient();

  if (!client) {
    const state = getLocalState(sessionId);
    const index = state.reviewItems.findIndex((item) => item.id === itemId);

    if (index === -1) {
      throw new Error("Review item not found");
    }

    const reviewedAt = new Date();
    const updated = updateReviewItem(state.reviewItems[index], grade, reviewedAt);
    state.reviewItems[index] = updated;
    state.reviewLogs.unshift({
      itemId,
      grade,
      reviewedAt: reviewedAt.toISOString(),
      nextDueDate: updated.dueDate
    });

    return updated;
  }

  try {
    await ensureSupabaseState(sessionId);

    const { data, error } = await client
      .from("review_items")
      .select("*")
      .eq("session_id", sessionId)
      .eq("review_item_id", itemId)
      .single();

    if (error || !data) {
      throw new Error("Review item not found");
    }

    const currentItem: ReviewItem = {
      id: data.review_item_id,
      front: data.front,
      back: data.back,
      hint: data.hint,
      tags: data.tags,
      easeFactor: data.ease_factor,
      intervalDays: data.interval_days,
      repetitionCount: data.repetition_count,
      lapseCount: data.lapse_count,
      dueDate: data.due_date,
      lastReviewedAt: data.last_reviewed_at ?? undefined
    };
    const reviewedAt = new Date();
    const updated = updateReviewItem(currentItem, grade, reviewedAt);

    await client
      .from("review_items")
      .update({
        ease_factor: updated.easeFactor,
        interval_days: updated.intervalDays,
        repetition_count: updated.repetitionCount,
        lapse_count: updated.lapseCount,
        due_date: updated.dueDate,
        last_reviewed_at: updated.lastReviewedAt ?? null
      })
      .eq("session_id", sessionId)
      .eq("review_item_id", itemId);

    await client.from("review_logs").insert({
      session_id: sessionId,
      review_item_id: itemId,
      grade,
      reviewed_at: reviewedAt.toISOString(),
      next_due_date: updated.dueDate
    });

    return updated;
  } catch {
    const state = getLocalState(sessionId);
    const index = state.reviewItems.findIndex((item) => item.id === itemId);

    if (index === -1) {
      throw new Error("Review item not found");
    }

    const reviewedAt = new Date();
    const updated = updateReviewItem(state.reviewItems[index], grade, reviewedAt);
    state.reviewItems[index] = updated;
    state.reviewLogs.unshift({
      itemId,
      grade,
      reviewedAt: reviewedAt.toISOString(),
      nextDueDate: updated.dueDate
    });

    return updated;
  }
}

export function deriveStats(state: AppState) {
  const dueCount = state.reviewItems.filter((item) => new Date(item.dueDate).getTime() <= Date.now()).length;
  const masteredCount = state.reviewItems.filter((item) => item.intervalDays >= 4).length;
  const weakItems = [...state.reviewItems]
    .sort((a: ReviewItem, b: ReviewItem) => b.lapseCount - a.lapseCount)
    .slice(0, 3);

  return {
    dueCount,
    masteredCount,
    weakItems,
    streak: state.streak,
    completedDays: state.currentDay - 1,
    planDays: state.plan.length,
    totalReviews: state.reviewLogs.length
  };
}

export function deriveRetentionScore(state: AppState) {
  if (state.reviewItems.length === 0) {
    return 0;
  }

  const total = state.reviewItems.reduce(
    (sum, item) => sum + Math.min(100, 35 + item.intervalDays * 8 + item.repetitionCount * 6 - item.lapseCount * 8),
    0,
  );

  return Math.round(total / state.reviewItems.length);
}
