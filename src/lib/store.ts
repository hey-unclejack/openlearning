import { buildCourseState, buildCourseTrack, buildReviewItemsForLesson } from "@/lib/data/curriculum";
import { createInitialState } from "@/lib/data/seed";
import { updateReviewItem } from "@/lib/srs";
import { getSupabaseAdminClient } from "@/lib/supabase";
import {
  AppState,
  CourseLesson,
  LearnerProfile,
  LearningFocus,
  NativeLanguage,
  ProficiencyLevel,
  ReviewGrade,
  ReviewItem,
  TargetLanguage
} from "@/lib/types";

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

function reviewItemFromRow(row: ReviewItemRow): ReviewItem {
  return {
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
  };
}

function reviewItemToRow(sessionId: string, item: ReviewItem) {
  return {
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
  };
}

function mapSupabaseState(profile: ProfileRow, reviewItemRows: ReviewItemRow[], reviewLogRows: ReviewLogRow[]): AppState {
  return buildCourseState({
    onboarded: profile.onboarded,
    streak: profile.streak,
    currentDay: profile.current_day,
    profile: {
      targetLanguage: profile.target_language as TargetLanguage,
      nativeLanguage: profile.native_language as NativeLanguage,
      level: profile.level as ProficiencyLevel,
      dailyMinutes: profile.daily_minutes,
      focus: profile.focus as LearningFocus
    },
    reviewItems: reviewItemRows.map(reviewItemFromRow),
    reviewLogs: reviewLogRows.map((row) => ({
      itemId: row.review_item_id,
      grade: row.grade,
      reviewedAt: row.reviewed_at,
      nextDueDate: row.next_due_date
    }))
  });
}

function replaceLocalState(sessionId: string, nextState: AppState) {
  getLocalStateMap().set(sessionId, nextState);
  return nextState;
}

function findCourseLesson(profile: LearnerProfile, lessonId: string): CourseLesson | undefined {
  const track = buildCourseTrack(profile);

  for (const unit of track.units) {
    const lesson = unit.lessons.find((item) => item.id === lessonId);
    if (lesson) {
      return lesson;
    }
  }

  return undefined;
}

function rebuildState(state: AppState, overrides: Partial<Pick<AppState, "onboarded" | "streak" | "profile" | "currentDay" | "reviewItems" | "reviewLogs">>) {
  return buildCourseState({
    onboarded: overrides.onboarded ?? state.onboarded,
    streak: overrides.streak ?? state.streak,
    profile: overrides.profile ?? state.profile ?? createInitialState().profile!,
    currentDay: overrides.currentDay ?? state.currentDay,
    reviewItems: overrides.reviewItems ?? state.reviewItems,
    reviewLogs: overrides.reviewLogs ?? state.reviewLogs
  });
}

async function seedSupabaseSession(sessionId: string) {
  const client = getSupabaseAdminClient();

  if (!client) {
    return;
  }

  const seed = createInitialState();
  await client.from("learner_profiles").upsert(
    {
      ...profileToRow(sessionId, seed),
      updated_at: new Date().toISOString()
    },
    { onConflict: "session_id" }
  );
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

  const [profileResult, reviewItemsResult, reviewLogsResult] = await Promise.all([
    client.from("learner_profiles").select("*").eq("session_id", sessionId).single(),
    client.from("review_items").select("*").eq("session_id", sessionId),
    client.from("review_logs").select("*").eq("session_id", sessionId).order("reviewed_at", { ascending: false }).limit(50)
  ]);

  if (profileResult.error || reviewItemsResult.error || reviewLogsResult.error) {
    throw new Error("Failed to load learner state from Supabase");
  }

  return mapSupabaseState(
    profileResult.data as unknown as ProfileRow,
    reviewItemsResult.data as unknown as ReviewItemRow[],
    reviewLogsResult.data as unknown as ReviewLogRow[]
  );
}

export async function readState(sessionId: string) {
  try {
    const supabaseState = await fetchStateFromSupabase(sessionId);

    if (supabaseState) {
      return replaceLocalState(sessionId, supabaseState);
    }
  } catch {
    return getLocalState(sessionId);
  }

  return getLocalState(sessionId);
}

export async function saveProfile(sessionId: string, profile: LearnerProfile) {
  const client = getSupabaseAdminClient();
  const currentState = await readState(sessionId);
  const nextState = rebuildState(currentState, {
    onboarded: true,
    profile
  });

  if (!client) {
    replaceLocalState(sessionId, nextState);
    return;
  }

  try {
    await ensureSupabaseState(sessionId);
    const { error } = await client
      .from("learner_profiles")
      .upsert(
        {
          ...profileToRow(sessionId, nextState),
          updated_at: new Date().toISOString()
        },
        { onConflict: "session_id" }
      );

    if (error) {
      throw error;
    }

    replaceLocalState(sessionId, nextState);
  } catch {
    replaceLocalState(sessionId, nextState);
  }
}

export async function getTodayLesson(sessionId: string) {
  const state = await readState(sessionId);
  const planDay = state.plan.find((item) => item.dayNumber === state.currentDay) ?? state.plan[0];
  const lesson = state.lessons[planDay.lessonId];
  const unit = state.courseTrack.units.find((item) => item.id === planDay.unitId);
  const courseLesson = unit?.lessons.find((item) => item.id === planDay.lessonId);

  return { planDay, lesson, unit, courseLesson };
}

export async function completeLesson(sessionId: string, lessonId: string) {
  const client = getSupabaseAdminClient();
  const state = await readState(sessionId);
  const today = state.plan.find((item) => item.dayNumber === state.currentDay) ?? state.plan[0];

  if (!today || today.lessonId !== lessonId || !state.profile) {
    return {
      currentDay: state.currentDay,
      nextLessonId: today?.lessonId,
      completedLessonTitle: undefined,
      completedUnitTitle: undefined,
      unitCompleted: false
    };
  }

  const courseLesson = findCourseLesson(state.profile, lessonId);
  if (!courseLesson) {
    throw new Error("Lesson not found");
  }
  const currentUnit = state.courseTrack.units.find((item) => item.id === today.unitId);
  const currentUnitLessons = currentUnit?.lessons ?? [];
  const currentUnitIndex = currentUnitLessons.findIndex((item) => item.id === lessonId);
  const unitCompleted = currentUnitIndex >= 0 && currentUnitIndex === currentUnitLessons.length - 1;

  const newReviewItems = buildReviewItemsForLesson(courseLesson).filter(
    (item) => !state.reviewItems.some((existing) => existing.id === item.id)
  );
  const mergedReviewItems = [...state.reviewItems, ...newReviewItems];
  const nextDay = Math.min(state.plan.length, state.currentDay + 1);
  const nextState = rebuildState(state, {
    currentDay: nextDay,
    reviewItems: mergedReviewItems
  });
  const nextPlanDay = nextState.plan.find((item) => item.dayNumber === nextState.currentDay);

  if (!client) {
    replaceLocalState(sessionId, nextState);
    return {
      currentDay: nextState.currentDay,
      nextLessonId: nextPlanDay?.lessonId,
      completedLessonTitle: courseLesson.title,
      completedUnitTitle: currentUnit?.title,
      unitCompleted
    };
  }

  try {
    await ensureSupabaseState(sessionId);

    const profilePayload = {
      ...profileToRow(sessionId, nextState),
      updated_at: new Date().toISOString()
    };
    const { error: profileError } = await client
      .from("learner_profiles")
      .upsert(profilePayload, { onConflict: "session_id" });

    if (profileError) {
      throw profileError;
    }

    if (newReviewItems.length > 0) {
      const { error: reviewError } = await client
        .from("review_items")
        .upsert(newReviewItems.map((item) => reviewItemToRow(sessionId, item)), { onConflict: "session_id,review_item_id" });

      if (reviewError) {
        throw reviewError;
      }
    }

    replaceLocalState(sessionId, nextState);
  } catch {
    replaceLocalState(sessionId, nextState);
  }

  return {
    currentDay: nextState.currentDay,
    nextLessonId: nextPlanDay?.lessonId,
    completedLessonTitle: courseLesson.title,
    completedUnitTitle: currentUnit?.title,
    unitCompleted
  };
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

    return (data as unknown as ReviewItemRow[]).map(reviewItemFromRow);
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

    const currentItem = reviewItemFromRow(data as unknown as ReviewItemRow);
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

    const state = getLocalState(sessionId);
    const reviewIndex = state.reviewItems.findIndex((item) => item.id === itemId);
    if (reviewIndex !== -1) {
      state.reviewItems[reviewIndex] = updated;
    }
    state.reviewLogs.unshift({
      itemId,
      grade,
      reviewedAt: reviewedAt.toISOString(),
      nextDueDate: updated.dueDate
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
    completedDays: Math.max(0, state.currentDay - 1),
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
    0
  );

  return Math.round(total / state.reviewItems.length);
}
