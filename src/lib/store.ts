import { buildCourseState, buildCourseTrack, buildReviewItemsForLesson } from "@/lib/data/curriculum";
import { normalizeAiSettings } from "@/lib/ai/settings";
import { createInitialState } from "@/lib/data/seed";
import { recordLearningPerformance } from "@/lib/practice-performance";
import { updateReviewItem } from "@/lib/srs";
import { getSupabaseAdminClient } from "@/lib/supabase";
import {
  AppState,
  AIProviderConnection,
  AISettings,
  AIUsageLog,
  CourseLesson,
  GeneratedLearningPlan,
  GeneratedPlanDay,
  LearningSource,
  LearnerProfile,
  LearningFocus,
  LearningType,
  NativeLanguage,
  ProficiencyLevel,
  ReviewGrade,
  ReviewItem,
  ReviewLog,
  ReviewSessionType,
  TargetLanguage,
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
  lesson_id?: string | null;
  unit_id?: string | null;
  learning_type?: LearningType | null;
  importance?: "core" | "extension" | null;
  ease_factor: number;
  interval_days: number;
  repetition_count: number;
  lapse_count: number;
  due_date: string;
  last_reviewed_at: string | null;
  last_outcome?: ReviewGrade | "unseen" | null;
  last_confidence?: number | null;
  needs_reinforcement?: boolean | null;
};

type ReviewLogRow = {
  review_item_id: string;
  grade: ReviewGrade;
  reviewed_at: string;
  next_due_date: string;
  session_type?: ReviewSessionType | null;
  confidence?: number | null;
  response_ms?: number | null;
  lesson_id?: string | null;
  unit_id?: string | null;
  learning_type?: LearningType | null;
  outcome?: "correct" | "incorrect" | null;
};

type LearningSourceRow = {
  source_id: string;
  source_type: LearningSource["type"];
  subject: LearningSource["subject"];
  title: string;
  raw_text: string;
  source_url?: string | null;
  metadata?: Record<string, string | number | boolean> | null;
  user_owns_rights: boolean;
  child_mode: boolean;
  created_at: string;
};

type GeneratedPlanRow = {
  generated_plan_id: string;
  source_id: string;
  subject: GeneratedLearningPlan["subject"];
  provider_mode: GeneratedLearningPlan["providerMode"];
  model: string;
  level: GeneratedLearningPlan["level"];
  focus: GeneratedLearningPlan["focus"];
  daily_minutes: number;
  status: GeneratedLearningPlan["status"];
  days: GeneratedLearningPlan["days"];
  quality_warnings: string[];
  cost_estimate_usd: number;
  created_at: string;
};

type AIProviderConnectionRow = {
  provider: AIProviderConnection["provider"];
  mode: AIProviderConnection["mode"];
  status: AIProviderConnection["status"];
  masked_credential?: string | null;
  encrypted_credential?: string | null;
  model?: string | null;
  created_at: string;
  updated_at: string;
};

type AISettingsRow = {
  enabled: boolean;
  permissions?: AISettings["permissions"] | null;
  connection_preference?: AISettings["connectionPreference"] | null;
  custom_connection_mode?: AISettings["customConnectionMode"] | null;
  updated_at?: string | null;
};

type AIUsageLogRow = {
  usage_log_id: string;
  provider: string;
  provider_mode: AIUsageLog["providerMode"];
  model: string;
  source_id?: string | null;
  generated_plan_id?: string | null;
  prompt_tokens: number;
  completion_tokens: number;
  cost_estimate_usd: number;
  official_quota: boolean;
  created_at: string;
};

type ReviewSubmissionOptions = {
  sessionType?: ReviewSessionType;
  confidence?: number;
  responseMs?: number;
};

type ReviewBucketKey = "must" | "should" | "can";

type ReviewBucket = {
  items: ReviewItem[];
  estimatedMinutes: number;
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
    focus: profile.focus,
  };
}

function reviewItemFromRow(row: ReviewItemRow): ReviewItem {
  return {
    id: row.review_item_id,
    front: row.front,
    back: row.back,
    hint: row.hint,
    tags: row.tags,
    lessonId: row.lesson_id ?? "legacy-lesson",
    unitId: row.unit_id ?? "legacy-unit",
    learningType: row.learning_type ?? "sentence-translation",
    importance: row.importance ?? "core",
    easeFactor: row.ease_factor,
    intervalDays: row.interval_days,
    repetitionCount: row.repetition_count,
    lapseCount: row.lapse_count,
    dueDate: row.due_date,
    lastReviewedAt: row.last_reviewed_at ?? undefined,
    lastOutcome: row.last_outcome ?? "unseen",
    lastConfidence: row.last_confidence ?? undefined,
    needsReinforcement: row.needs_reinforcement ?? false,
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
    lesson_id: item.lessonId,
    unit_id: item.unitId,
    learning_type: item.learningType,
    importance: item.importance,
    ease_factor: item.easeFactor,
    interval_days: item.intervalDays,
    repetition_count: item.repetitionCount,
    lapse_count: item.lapseCount,
    due_date: item.dueDate,
    last_reviewed_at: item.lastReviewedAt ?? null,
    last_outcome: item.lastOutcome ?? "unseen",
    last_confidence: item.lastConfidence ?? null,
    needs_reinforcement: item.needsReinforcement ?? false,
  };
}

function reviewLogFromRow(row: ReviewLogRow): ReviewLog {
  return {
    itemId: row.review_item_id,
    grade: row.grade,
    reviewedAt: row.reviewed_at,
    nextDueDate: row.next_due_date,
    sessionType: row.session_type ?? "formal",
    confidence: row.confidence ?? undefined,
    responseMs: row.response_ms ?? undefined,
    lessonId: row.lesson_id ?? undefined,
    unitId: row.unit_id ?? undefined,
    learningType: row.learning_type ?? undefined,
    outcome: row.outcome ?? undefined,
  };
}

function learningSourceFromRow(row: LearningSourceRow): LearningSource {
  return {
    id: row.source_id,
    type: row.source_type,
    subject: row.subject,
    title: row.title,
    rawText: row.raw_text,
    sourceUrl: row.source_url ?? undefined,
    metadata: row.metadata ?? undefined,
    userOwnsRights: row.user_owns_rights,
    childMode: row.child_mode,
    createdAt: row.created_at,
  };
}

function generatedPlanFromRow(row: GeneratedPlanRow): GeneratedLearningPlan {
  return {
    id: row.generated_plan_id,
    sourceId: row.source_id,
    subject: row.subject,
    providerMode: row.provider_mode,
    model: row.model,
    level: row.level,
    focus: row.focus,
    dailyMinutes: row.daily_minutes,
    status: row.status,
    days: row.days,
    qualityWarnings: row.quality_warnings,
    costEstimateUsd: Number(row.cost_estimate_usd),
    createdAt: row.created_at,
  };
}

function aiProviderConnectionFromRow(row: AIProviderConnectionRow): AIProviderConnection {
  return {
    id: `${row.provider}-${row.mode}`,
    provider: row.provider,
    mode: row.mode,
    status: row.status,
    maskedCredential: row.masked_credential ?? undefined,
    encryptedCredential: row.encrypted_credential ?? undefined,
    model: row.model ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function aiSettingsFromRow(row?: AISettingsRow | null): AISettings {
  return normalizeAiSettings(
    row
      ? {
          enabled: row.enabled,
          permissions: row.permissions ?? undefined,
          connectionPreference: row.connection_preference ?? undefined,
          customConnectionMode: row.custom_connection_mode ?? undefined,
          updatedAt: row.updated_at ?? undefined,
        }
      : undefined,
  );
}

function aiUsageLogFromRow(row: AIUsageLogRow): AIUsageLog {
  return {
    id: row.usage_log_id,
    provider: row.provider,
    providerMode: row.provider_mode,
    model: row.model,
    sourceId: row.source_id ?? undefined,
    generatedPlanId: row.generated_plan_id ?? undefined,
    promptTokens: row.prompt_tokens,
    completionTokens: row.completion_tokens,
    costEstimateUsd: Number(row.cost_estimate_usd),
    officialQuota: row.official_quota,
    createdAt: row.created_at,
  };
}

function learningSourceToRow(sessionId: string, source: LearningSource) {
  return {
    session_id: sessionId,
    source_id: source.id,
    source_type: source.type,
    subject: source.subject,
    title: source.title,
    raw_text: source.rawText,
    source_url: source.sourceUrl ?? null,
    metadata: source.metadata ?? {},
    user_owns_rights: source.userOwnsRights,
    child_mode: source.childMode,
    created_at: source.createdAt,
  };
}

function generatedPlanToRow(sessionId: string, plan: GeneratedLearningPlan) {
  return {
    session_id: sessionId,
    generated_plan_id: plan.id,
    source_id: plan.sourceId,
    subject: plan.subject,
    provider_mode: plan.providerMode,
    model: plan.model,
    level: plan.level,
    focus: plan.focus,
    daily_minutes: plan.dailyMinutes,
    status: plan.status,
    days: plan.days,
    quality_warnings: plan.qualityWarnings,
    cost_estimate_usd: plan.costEstimateUsd,
    created_at: plan.createdAt,
  };
}

function aiProviderConnectionToRow(sessionId: string, connection: AIProviderConnection) {
  return {
    session_id: sessionId,
    provider: connection.provider,
    mode: connection.mode,
    status: connection.status,
    masked_credential: connection.maskedCredential ?? null,
    encrypted_credential: connection.encryptedCredential ?? null,
    model: connection.model ?? null,
    created_at: connection.createdAt,
    updated_at: connection.updatedAt,
  };
}

function aiSettingsToRow(sessionId: string, settings: AISettings) {
  return {
    session_id: sessionId,
    enabled: settings.enabled,
    permissions: settings.permissions,
    connection_preference: settings.connectionPreference,
    custom_connection_mode: settings.customConnectionMode,
    updated_at: settings.updatedAt ?? new Date().toISOString(),
  };
}

function aiUsageLogToRow(sessionId: string, usageLog: AIUsageLog) {
  return {
    session_id: sessionId,
    usage_log_id: usageLog.id,
    provider: usageLog.provider,
    provider_mode: usageLog.providerMode,
    model: usageLog.model,
    source_id: usageLog.sourceId ?? null,
    generated_plan_id: usageLog.generatedPlanId ?? null,
    prompt_tokens: usageLog.promptTokens,
    completion_tokens: usageLog.completionTokens,
    cost_estimate_usd: usageLog.costEstimateUsd,
    official_quota: usageLog.officialQuota,
    created_at: usageLog.createdAt,
  };
}

function mapSupabaseState(
  profile: ProfileRow,
  reviewItemRows: ReviewItemRow[],
  reviewLogRows: ReviewLogRow[],
  aiRows?: {
    learningSources: LearningSourceRow[];
    generatedPlans: GeneratedPlanRow[];
    aiSettings?: AISettingsRow | null;
    aiProviderConnections: AIProviderConnectionRow[];
    aiUsageLogs: AIUsageLogRow[];
  },
): AppState {
  const localAiState = getLocalAiState(profile.session_id);

  return buildCourseState({
    onboarded: profile.onboarded,
    streak: profile.streak,
    currentDay: profile.current_day,
    profile: {
      targetLanguage: profile.target_language as TargetLanguage,
      nativeLanguage: profile.native_language as NativeLanguage,
      level: profile.level as ProficiencyLevel,
      dailyMinutes: profile.daily_minutes,
      focus: profile.focus as LearningFocus,
    },
    reviewItems: reviewItemRows.map(reviewItemFromRow),
    reviewLogs: reviewLogRows.map(reviewLogFromRow),
    learningSources: aiRows?.learningSources.map(learningSourceFromRow) ?? localAiState.learningSources,
    generatedPlans: aiRows?.generatedPlans.map(generatedPlanFromRow) ?? localAiState.generatedPlans,
    aiSettings: aiRows?.aiSettings ? aiSettingsFromRow(aiRows.aiSettings) : localAiState.aiSettings,
    aiProviderConnections: aiRows?.aiProviderConnections.map(aiProviderConnectionFromRow) ?? localAiState.aiProviderConnections,
    aiUsageLogs: aiRows?.aiUsageLogs.map(aiUsageLogFromRow) ?? localAiState.aiUsageLogs,
  });
}

function getLocalAiState(sessionId: string) {
  const state = getLocalStateMap().get(sessionId);

  return {
    learningSources: state?.learningSources ?? [],
    generatedPlans: state?.generatedPlans ?? [],
    aiSettings: state?.aiSettings ?? normalizeAiSettings(),
    aiProviderConnections: state?.aiProviderConnections ?? [],
    aiUsageLogs: state?.aiUsageLogs ?? [],
  };
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

function rebuildState(
  state: AppState,
  overrides: Partial<
    Pick<
      AppState,
      | "onboarded"
      | "streak"
      | "profile"
      | "currentDay"
      | "reviewItems"
      | "reviewLogs"
      | "learningSources"
      | "generatedPlans"
      | "aiSettings"
      | "aiProviderConnections"
      | "aiUsageLogs"
    >
  >,
) {
  return buildCourseState({
    onboarded: overrides.onboarded ?? state.onboarded,
    streak: overrides.streak ?? state.streak,
    profile: overrides.profile ?? state.profile ?? createInitialState().profile!,
    currentDay: overrides.currentDay ?? state.currentDay,
    reviewItems: overrides.reviewItems ?? state.reviewItems,
    reviewLogs: overrides.reviewLogs ?? state.reviewLogs,
    learningSources: overrides.learningSources ?? state.learningSources,
    generatedPlans: overrides.generatedPlans ?? state.generatedPlans,
    aiSettings: overrides.aiSettings ?? state.aiSettings,
    aiProviderConnections: overrides.aiProviderConnections ?? state.aiProviderConnections,
    aiUsageLogs: overrides.aiUsageLogs ?? state.aiUsageLogs,
  });
}

function scoreConfidence(grade: ReviewGrade) {
  return {
    again: 0.2,
    hard: 0.45,
    good: 0.75,
    easy: 0.95,
  }[grade];
}

function isCorrectGrade(grade: ReviewGrade) {
  return grade !== "again";
}

function estimateSecondsForItem(item: ReviewItem, bucket: ReviewBucketKey) {
  const base = bucket === "must" ? 65 : bucket === "should" ? 50 : 40;
  const importanceAdjustment = item.importance === "core" ? 8 : 0;
  const reinforcementAdjustment = item.needsReinforcement ? 12 : 0;
  return base + importanceAdjustment + reinforcementAdjustment;
}

function getTodayBudget(dailyMinutes = 15) {
  if (dailyMinutes <= 10) {
    return { reviewMinutes: 6, lessonMinutes: 3, bufferMinutes: 1 };
  }

  if (dailyMinutes <= 15) {
    return { reviewMinutes: 8, lessonMinutes: 5, bufferMinutes: 2 };
  }

  if (dailyMinutes <= 20) {
    return { reviewMinutes: 10, lessonMinutes: 8, bufferMinutes: 2 };
  }

  return { reviewMinutes: 14, lessonMinutes: 13, bufferMinutes: 3 };
}

function getOverdueDays(item: ReviewItem) {
  const diff = Date.now() - new Date(item.dueDate).getTime();
  return Math.max(0, Math.floor(diff / (24 * 60 * 60 * 1000)));
}

function sortReviewPriority(a: ReviewItem, b: ReviewItem) {
  const overdueDelta = getOverdueDays(b) - getOverdueDays(a);
  if (overdueDelta !== 0) {
    return overdueDelta;
  }

  const lapseDelta = b.lapseCount - a.lapseCount;
  if (lapseDelta !== 0) {
    return lapseDelta;
  }

  if (a.importance !== b.importance) {
    return a.importance === "core" ? -1 : 1;
  }

  return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
}

function buildReviewLog(item: ReviewItem, grade: ReviewGrade, reviewedAt: Date, sessionType: ReviewSessionType, options: ReviewSubmissionOptions): ReviewLog {
  return {
    itemId: item.id,
    grade,
    reviewedAt: reviewedAt.toISOString(),
    nextDueDate: item.dueDate,
    sessionType,
    confidence: options.confidence ?? scoreConfidence(grade),
    responseMs: options.responseMs,
    lessonId: item.lessonId,
    unitId: item.unitId,
    learningType: item.learningType,
    outcome: isCorrectGrade(grade) ? "correct" : "incorrect",
  };
}

function applyReviewUpdate(item: ReviewItem, grade: ReviewGrade, reviewedAt: Date, sessionType: ReviewSessionType, options: ReviewSubmissionOptions) {
  const confidence = options.confidence ?? scoreConfidence(grade);

  if (sessionType === "formal" || sessionType === "warmup") {
    const updated = updateReviewItem(item, grade, reviewedAt);
    return {
      ...updated,
      lastOutcome: grade,
      lastConfidence: confidence,
      needsReinforcement: grade === "again" || grade === "hard" || item.needsReinforcement === true,
    };
  }

  return {
    ...item,
    lastReviewedAt: reviewedAt.toISOString(),
    lastOutcome: grade,
    lastConfidence: confidence,
    needsReinforcement: grade === "again" || grade === "hard",
  };
}

function getReviewBucketsFromState(state: AppState) {
  const budget = getTodayBudget(state.profile?.dailyMinutes ?? 15);
  const dueItems = state.reviewItems.filter((item) => new Date(item.dueDate).getTime() <= Date.now());
  const must = dueItems
    .filter((item) => getOverdueDays(item) >= 1 || item.lapseCount >= 2 || item.needsReinforcement)
    .sort(sortReviewPriority);
  const should = dueItems
    .filter((item) => !must.some((mustItem) => mustItem.id === item.id))
    .sort(sortReviewPriority);

  const canCandidates = state.reviewItems
    .filter((item) => !dueItems.some((dueItem) => dueItem.id === item.id))
    .filter((item) => item.needsReinforcement || item.lapseCount > 0 || item.lastOutcome === "again" || item.lastOutcome === "hard")
    .sort(sortReviewPriority)
    .slice(0, 4);

  const mustSeconds = must.reduce((sum, item) => sum + estimateSecondsForItem(item, "must"), 0);
  const shouldSeconds = should.reduce((sum, item) => sum + estimateSecondsForItem(item, "should"), 0);
  const canSeconds = canCandidates.reduce((sum, item) => sum + estimateSecondsForItem(item, "can"), 0);

  const picked: ReviewItem[] = [];
  let consumedSeconds = 0;
  const reviewBudgetSeconds = budget.reviewMinutes * 60;

  must.forEach((item) => {
    picked.push(item);
    consumedSeconds += estimateSecondsForItem(item, "must");
  });

  should.forEach((item) => {
    const nextCost = estimateSecondsForItem(item, "should");
    if (picked.length === 0 || consumedSeconds + nextCost <= reviewBudgetSeconds) {
      picked.push(item);
      consumedSeconds += nextCost;
    }
  });

  canCandidates.forEach((item) => {
    const nextCost = estimateSecondsForItem(item, "can");
    if (consumedSeconds + nextCost <= reviewBudgetSeconds) {
      picked.push(item);
      consumedSeconds += nextCost;
    }
  });

  return {
    budget,
    reviewBudgetSeconds,
    picked,
    must: {
      items: must,
      estimatedMinutes: Math.max(1, Math.ceil(mustSeconds / 60)),
    },
    should: {
      items: should,
      estimatedMinutes: Math.max(0, Math.ceil(shouldSeconds / 60)),
    },
    can: {
      items: canCandidates,
      estimatedMinutes: Math.max(0, Math.ceil(canSeconds / 60)),
    },
  };
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
      updated_at: new Date().toISOString(),
    },
    { onConflict: "session_id" },
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
    client.from("review_logs").select("*").eq("session_id", sessionId).order("reviewed_at", { ascending: false }).limit(100),
  ]);

  if (profileResult.error || reviewItemsResult.error || reviewLogsResult.error) {
    throw new Error("Failed to load learner state from Supabase");
  }

  const aiRows = await (async () => {
    try {
      const [sources, plans, settings, connections, usageLogs] = await Promise.all([
        client.from("learning_sources").select("*").eq("session_id", sessionId).order("created_at", { ascending: false }).limit(30),
        client.from("generated_plans").select("*").eq("session_id", sessionId).order("created_at", { ascending: false }).limit(20),
        client.from("ai_settings").select("*").eq("session_id", sessionId).maybeSingle(),
        client.from("ai_provider_connections").select("*").eq("session_id", sessionId),
        client.from("ai_usage_logs").select("*").eq("session_id", sessionId).order("created_at", { ascending: false }).limit(200),
      ]);

      if (sources.error || plans.error || connections.error || usageLogs.error) {
        return undefined;
      }

      return {
        learningSources: sources.data as unknown as LearningSourceRow[],
        generatedPlans: plans.data as unknown as GeneratedPlanRow[],
        aiSettings: settings.error ? undefined : settings.data as unknown as AISettingsRow | null,
        aiProviderConnections: connections.data as unknown as AIProviderConnectionRow[],
        aiUsageLogs: usageLogs.data as unknown as AIUsageLogRow[],
      };
    } catch {
      return undefined;
    }
  })();

  return mapSupabaseState(
    profileResult.data as unknown as ProfileRow,
    reviewItemsResult.data as unknown as ReviewItemRow[],
    reviewLogsResult.data as unknown as ReviewLogRow[],
    aiRows,
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
    profile,
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
          updated_at: new Date().toISOString(),
        },
        { onConflict: "session_id" },
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
  const isFirstLesson = state.currentDay === 1;

  if (!today || today.lessonId !== lessonId || !state.profile) {
    const generatedResult = await completeGeneratedLesson(sessionId, lessonId);

    if (generatedResult) {
      return generatedResult;
    }

    return {
      currentDay: state.currentDay,
      nextLessonId: today?.lessonId,
      completedLessonId: undefined,
      completedLessonTitle: undefined,
      completedUnitTitle: undefined,
      unitCompleted: false,
      diagnosticLessonId: undefined,
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
    (item) => !state.reviewItems.some((existing) => existing.id === item.id),
  );
  const mergedReviewItems = [...state.reviewItems, ...newReviewItems];
  const nextDay = Math.min(state.plan.length, state.currentDay + 1);
  const nextState = rebuildState(state, {
    currentDay: nextDay,
    reviewItems: mergedReviewItems,
  });
  const nextPlanDay = nextState.plan.find((item) => item.dayNumber === nextState.currentDay);

  if (!client) {
    replaceLocalState(sessionId, nextState);
    return {
      currentDay: nextState.currentDay,
      nextLessonId: nextPlanDay?.lessonId,
      completedLessonId: lessonId,
      completedLessonTitle: courseLesson.title,
      completedUnitTitle: currentUnit?.title,
      unitCompleted,
      diagnosticLessonId: isFirstLesson ? lessonId : undefined,
    };
  }

  try {
    await ensureSupabaseState(sessionId);

    const profilePayload = {
      ...profileToRow(sessionId, nextState),
      updated_at: new Date().toISOString(),
    };
    const { error: profileError } = await client.from("learner_profiles").upsert(profilePayload, { onConflict: "session_id" });

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
    completedLessonId: lessonId,
    completedLessonTitle: courseLesson.title,
    completedUnitTitle: currentUnit?.title,
    unitCompleted,
    diagnosticLessonId: isFirstLesson ? lessonId : undefined,
  };
}

function generatedDayToCourseLesson(plan: GeneratedLearningPlan, day: GeneratedPlanDay): CourseLesson {
  return {
    id: day.lessonId,
    unitId: `generated-${plan.id}`,
    lessonNumber: day.dayNumber,
    dayNumber: day.dayNumber,
    title: day.title,
    objective: day.objective,
    vocabulary: day.vocabulary,
    chunks: day.chunks,
    dialogue: day.dialogue,
    asset: day.asset,
  };
}

export async function completeGeneratedLesson(sessionId: string, lessonId: string) {
  const client = getSupabaseAdminClient();
  const state = await readState(sessionId);
  const plan = state.generatedPlans.find((item) => item.days.some((day) => day.lessonId === lessonId));
  const day = plan?.days.find((item) => item.lessonId === lessonId);

  if (!plan || !day) {
    return null;
  }

  const courseLesson = generatedDayToCourseLesson(plan, day);
  const newReviewItems = buildReviewItemsForLesson(courseLesson).filter(
    (item) => !state.reviewItems.some((existing) => existing.id === item.id),
  );
  const completedAt = new Date().toISOString();
  const generatedPlans = state.generatedPlans.map((item) =>
    item.id === plan.id
      ? {
          ...item,
          status: item.days.every((candidate) => candidate.lessonId === lessonId || candidate.completedAt) ? "completed" as const : item.status,
          days: item.days.map((candidate) =>
            candidate.lessonId === lessonId ? { ...candidate, completedAt } : candidate,
          ),
        }
      : item,
  );
  const nextState = rebuildState(state, {
    reviewItems: [...state.reviewItems, ...newReviewItems],
    generatedPlans,
  });

  replaceLocalState(sessionId, nextState);

  if (client) {
    try {
      await ensureSupabaseState(sessionId);
      await client
        .from("generated_plans")
        .upsert(generatedPlanToRow(sessionId, generatedPlans.find((item) => item.id === plan.id) ?? plan), {
          onConflict: "session_id,generated_plan_id",
        });

      if (newReviewItems.length > 0) {
        await client
          .from("review_items")
          .upsert(newReviewItems.map((item) => reviewItemToRow(sessionId, item)), { onConflict: "session_id,review_item_id" });
      }
    } catch {
      // Keep local fallback behavior when optional generated-plan tables are unavailable.
    }
  }

  return {
    currentDay: nextState.currentDay,
    nextLessonId: undefined,
    completedLessonId: lessonId,
    completedLessonTitle: day.title,
    completedUnitTitle: "AI Generated Plan",
    unitCompleted: false,
    diagnosticLessonId: lessonId,
  };
}

export async function getGeneratedLessonContext(sessionId: string, lessonId: string) {
  const state = await readState(sessionId);
  const plan = state.generatedPlans.find((item) => item.days.some((day) => day.lessonId === lessonId));
  const day = plan?.days.find((item) => item.lessonId === lessonId);

  if (!plan || !day) {
    return null;
  }

  return {
    plan,
    day,
    nextDay: plan.days.find((item) => item.dayNumber === day.dayNumber + 1),
  };
}

export async function getAiUsageSummary(sessionId: string) {
  const state = await readState(sessionId);
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayLogs = state.aiUsageLogs.filter((log) => log.createdAt.slice(0, 10) === todayKey);
  const officialToday = todayLogs.filter((log) => log.officialQuota).length;
  const byokToday = todayLogs.filter((log) => log.providerMode === "byok").length;
  const dailyOfficialLimit = Number(process.env.AI_FREE_DAILY_GENERATIONS ?? 3);

  return {
    dailyOfficialLimit,
    officialToday,
    officialRemaining: Math.max(0, dailyOfficialLimit - officialToday),
    byokToday,
    totalCostEstimateUsd: state.aiUsageLogs.reduce((sum, log) => sum + log.costEstimateUsd, 0),
    todayCostEstimateUsd: todayLogs.reduce((sum, log) => sum + log.costEstimateUsd, 0),
  };
}

export async function getAiBusinessSnapshot(sessionId: string) {
  const state = await readState(sessionId);
  const usageSummary = await getAiUsageSummary(sessionId);
  const generatedPlanCount = state.generatedPlans.length;
  const completedPlanCount = state.generatedPlans.filter((plan) => plan.status === "completed").length;
  const activePlanCount = state.generatedPlans.filter((plan) => plan.status === "active").length;
  const completedLessonCount = state.generatedPlans.reduce(
    (sum, plan) => sum + plan.days.filter((day) => Boolean(day.completedAt)).length,
    0,
  );
  const totalGeneratedLessonCount = state.generatedPlans.reduce((sum, plan) => sum + plan.days.length, 0);
  const sourceTypeCounts = state.learningSources.reduce<Record<LearningSource["type"], number>>(
    (counts, source) => ({
      ...counts,
      [source.type]: counts[source.type] + 1,
    }),
    {
      topic: 0,
      text: 0,
      pdf: 0,
      image: 0,
      url: 0,
      youtube: 0,
    },
  );
  const officialUsageCount = state.aiUsageLogs.filter((log) => log.providerMode === "official").length;
  const byokUsageCount = state.aiUsageLogs.filter((log) => log.providerMode === "byok").length;
  const childModeSourceCount = state.learningSources.filter((source) => source.childMode).length;
  const byokConfigured = state.aiProviderConnections.some((connection) => connection.mode === "byok" && connection.status === "configured");
  const completionRate = totalGeneratedLessonCount > 0 ? completedLessonCount / totalGeneratedLessonCount : 0;
  const avgCostPerPlan = generatedPlanCount > 0 ? usageSummary.totalCostEstimateUsd / generatedPlanCount : 0;
  const topSourceType = (Object.entries(sourceTypeCounts) as Array<[LearningSource["type"], number]>)
    .sort((a, b) => b[1] - a[1])
    .find(([, count]) => count > 0)?.[0];

  return {
    ...usageSummary,
    generatedPlanCount,
    completedPlanCount,
    activePlanCount,
    completedLessonCount,
    totalGeneratedLessonCount,
    completionRate,
    avgCostPerPlan,
    officialUsageCount,
    byokUsageCount,
    byokConfigured,
    childModeSourceCount,
    sourceTypeCounts,
    topSourceType,
    shouldPromoteByok: !byokConfigured && (usageSummary.officialRemaining === 0 || officialUsageCount >= usageSummary.dailyOfficialLimit),
    shouldTightenFreeQuota: avgCostPerPlan > 0.01 && byokUsageCount === 0,
  };
}

export async function saveGeneratedLearningPlan(sessionId: string, params: {
  source: LearningSource;
  plan: GeneratedLearningPlan;
  usageLog: AIUsageLog;
}) {
  const client = getSupabaseAdminClient();
  const state = await readState(sessionId);
  const nextState = rebuildState(state, {
    learningSources: [params.source, ...state.learningSources.filter((item) => item.id !== params.source.id)].slice(0, 30),
    generatedPlans: [params.plan, ...state.generatedPlans.filter((item) => item.id !== params.plan.id)].slice(0, 20),
    aiUsageLogs: [params.usageLog, ...state.aiUsageLogs].slice(0, 200),
  });
  replaceLocalState(sessionId, nextState);

  if (client) {
    try {
      await ensureSupabaseState(sessionId);
      await Promise.all([
        client.from("learning_sources").upsert(learningSourceToRow(sessionId, params.source), { onConflict: "session_id,source_id" }),
        client.from("generated_plans").upsert(generatedPlanToRow(sessionId, params.plan), { onConflict: "session_id,generated_plan_id" }),
        client.from("ai_usage_logs").upsert(aiUsageLogToRow(sessionId, params.usageLog), { onConflict: "session_id,usage_log_id" }),
      ]);
    } catch {
      // The local fallback remains authoritative when the optional AI migration has not been applied yet.
    }
  }

  return nextState.generatedPlans[0];
}

export async function deleteGeneratedLearningPlan(sessionId: string, planId: string) {
  const client = getSupabaseAdminClient();
  const state = await readState(sessionId);
  const plan = state.generatedPlans.find((item) => item.id === planId);

  if (!plan) {
    return false;
  }

  const lessonIds = new Set(plan.days.map((day) => day.lessonId));
  const reviewSeedIds = new Set(plan.days.flatMap((day) => day.asset.reviewSeeds.map((seed) => seed.id)));
  const nextState = rebuildState(state, {
    generatedPlans: state.generatedPlans.filter((item) => item.id !== planId),
    learningSources: state.learningSources.filter((item) => item.id !== plan.sourceId),
    reviewItems: state.reviewItems.filter((item) => !lessonIds.has(item.lessonId) && !reviewSeedIds.has(item.id)),
  });

  replaceLocalState(sessionId, nextState);

  if (client) {
    try {
      await ensureSupabaseState(sessionId);
      await Promise.all([
        client.from("generated_plans").delete().eq("session_id", sessionId).eq("generated_plan_id", planId),
        client.from("learning_sources").delete().eq("session_id", sessionId).eq("source_id", plan.sourceId),
        client.from("review_items").delete().eq("session_id", sessionId).in("lesson_id", [...lessonIds]),
      ]);
    } catch {
      // Local state already reflects the deletion; Supabase may not have the optional AI tables yet.
    }
  }

  return true;
}

export async function getGeneratedLearningPlan(sessionId: string, planId: string) {
  const state = await readState(sessionId);
  return state.generatedPlans.find((plan) => plan.id === planId);
}

export async function getGeneratedLesson(sessionId: string, planId: string, lessonId: string) {
  const plan = await getGeneratedLearningPlan(sessionId, planId);
  const day = plan?.days.find((item) => item.lessonId === lessonId);

  if (!plan || !day) {
    return null;
  }

  return {
    plan,
    day,
    courseLesson: generatedDayToCourseLesson(plan, day),
  };
}

export async function saveAiProviderConnection(sessionId: string, connection: AIProviderConnection) {
  const client = getSupabaseAdminClient();
  const state = await readState(sessionId);
  const nextState = rebuildState(state, {
    aiProviderConnections: [
      connection,
      ...state.aiProviderConnections.filter((item) => !(item.provider === connection.provider && item.mode === connection.mode)),
    ].slice(0, 10),
  });
  replaceLocalState(sessionId, nextState);

  if (client) {
    try {
      await ensureSupabaseState(sessionId);
      await client
        .from("ai_provider_connections")
        .upsert(aiProviderConnectionToRow(sessionId, connection), { onConflict: "session_id,provider,mode" });
    } catch {
      // Keep the encrypted key in the local fallback for local/demo use.
    }
  }

  return connection;
}

export async function deleteAiProviderConnection(sessionId: string, provider = "openai") {
  const client = getSupabaseAdminClient();
  const state = await readState(sessionId);
  const nextState = rebuildState(state, {
    aiProviderConnections: state.aiProviderConnections.filter((item) => item.provider !== provider),
  });

  replaceLocalState(sessionId, nextState);

  if (client) {
    try {
      await ensureSupabaseState(sessionId);
      await client.from("ai_provider_connections").delete().eq("session_id", sessionId).eq("provider", provider);
    } catch {
      // Local fallback remains authoritative when the optional AI tables are unavailable.
    }
  }

  return true;
}

export async function getAiProviderConnection(sessionId: string, provider = "openai") {
  const state = await readState(sessionId);
  return state.aiProviderConnections.find((item) => item.provider === provider && item.status === "configured");
}

export async function saveAiSettings(sessionId: string, settings: AISettings) {
  const client = getSupabaseAdminClient();
  const state = await readState(sessionId);
  const nextSettings = normalizeAiSettings({
    ...settings,
    updatedAt: new Date().toISOString(),
  });
  const nextState = rebuildState(state, {
    aiSettings: nextSettings,
  });

  replaceLocalState(sessionId, nextState);

  if (client) {
    try {
      await ensureSupabaseState(sessionId);
      await client.from("ai_settings").upsert(aiSettingsToRow(sessionId, nextSettings), { onConflict: "session_id" });
    } catch {
      // Local fallback remains authoritative when the optional AI settings table is unavailable.
    }
  }

  return nextSettings;
}

export async function getDueReviewItems(sessionId: string) {
  const state = await readState(sessionId);
  return state.reviewItems.filter((item) => new Date(item.dueDate).getTime() <= Date.now()).sort(sortReviewPriority);
}

export async function getTodayReviewPlan(sessionId: string) {
  const state = await readState(sessionId);
  const buckets = getReviewBucketsFromState(state);

  return {
    ...buckets,
    counts: {
      must: buckets.must.items.length,
      should: buckets.should.items.length,
      can: buckets.can.items.length,
      scheduled: buckets.picked.length,
    },
  };
}

export async function getScheduledReviewItems(sessionId: string) {
  const { picked } = await getTodayReviewPlan(sessionId);
  return picked;
}

export async function getDiagnosticReviewItems(sessionId: string, lessonId: string) {
  const state = await readState(sessionId);
  return state.reviewItems.filter((item) => item.lessonId === lessonId).slice(0, 3);
}

export async function getLessonWarmupItems(sessionId: string, lessonId: string) {
  const state = await readState(sessionId);
  const targetLesson = state.plan.find((item) => item.lessonId === lessonId);

  if (!targetLesson) {
    return [];
  }

  return state.reviewItems
    .filter((item) => item.unitId === targetLesson.unitId && item.lessonId !== lessonId)
    .filter((item) => item.needsReinforcement || item.lapseCount >= 2 || item.lastOutcome === "again")
    .sort(sortReviewPriority)
    .slice(0, 2);
}

export async function getExtraReviewItems(
  sessionId: string,
  scope: "all" | "recent" | "weak" | "lesson" = "all",
  lessonId?: string,
) {
  const state = await readState(sessionId);
  const completedLessonIds = new Set(
    state.plan.filter((item) => item.dayNumber < state.currentDay).map((item) => item.lessonId),
  );

  const base = state.reviewItems.filter((item) => completedLessonIds.has(item.lessonId));
  const sorted = [...base].sort(sortReviewPriority);

  if (scope === "lesson" && lessonId) {
    return sorted.filter((item) => item.lessonId === lessonId).slice(0, 8);
  }

  if (scope === "recent") {
    const recentLessonIds = state.plan
      .filter((item) => item.dayNumber < state.currentDay)
      .slice(Math.max(0, state.currentDay - 3), state.currentDay)
      .map((item) => item.lessonId);
    return sorted.filter((item) => recentLessonIds.includes(item.lessonId)).slice(0, 8);
  }

  if (scope === "weak") {
    return sorted.filter((item) => item.needsReinforcement || item.lapseCount > 0).slice(0, 8);
  }

  return sorted.slice(0, 8);
}

export async function reviewItem(sessionId: string, itemId: string, grade: ReviewGrade, options: ReviewSubmissionOptions = {}) {
  const sessionType = options.sessionType ?? "formal";
  const client = getSupabaseAdminClient();

  const persistPerformance = async (item: ReviewItem) => {
    await recordLearningPerformance({
      sessionId,
      learningType: item.learningType,
      correct: isCorrectGrade(grade),
    });
  };

  if (!client) {
    const state = getLocalState(sessionId);
    const index = state.reviewItems.findIndex((item) => item.id === itemId);

    if (index === -1) {
      throw new Error("Review item not found");
    }

    const reviewedAt = new Date();
    const updated = applyReviewUpdate(state.reviewItems[index], grade, reviewedAt, sessionType, options);
    state.reviewItems[index] = updated;
    state.reviewLogs.unshift(buildReviewLog(updated, grade, reviewedAt, sessionType, options));
    await persistPerformance(updated);
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
    const updated = applyReviewUpdate(currentItem, grade, reviewedAt, sessionType, options);

    await client
      .from("review_items")
      .update({
        ease_factor: updated.easeFactor,
        interval_days: updated.intervalDays,
        repetition_count: updated.repetitionCount,
        lapse_count: updated.lapseCount,
        due_date: updated.dueDate,
        last_reviewed_at: updated.lastReviewedAt ?? null,
        last_outcome: updated.lastOutcome ?? "unseen",
        last_confidence: updated.lastConfidence ?? null,
        needs_reinforcement: updated.needsReinforcement ?? false,
      })
      .eq("session_id", sessionId)
      .eq("review_item_id", itemId);

    await client.from("review_logs").insert({
      session_id: sessionId,
      review_item_id: itemId,
      grade,
      reviewed_at: reviewedAt.toISOString(),
      next_due_date: updated.dueDate,
      session_type: sessionType,
      confidence: options.confidence ?? scoreConfidence(grade),
      response_ms: options.responseMs ?? null,
      lesson_id: updated.lessonId,
      unit_id: updated.unitId,
      learning_type: updated.learningType,
      outcome: isCorrectGrade(grade) ? "correct" : "incorrect",
    });

    const state = getLocalState(sessionId);
    const reviewIndex = state.reviewItems.findIndex((item) => item.id === itemId);
    if (reviewIndex !== -1) {
      state.reviewItems[reviewIndex] = updated;
    }
    state.reviewLogs.unshift(buildReviewLog(updated, grade, reviewedAt, sessionType, options));

    await persistPerformance(updated);
    return updated;
  } catch {
    const state = getLocalState(sessionId);
    const index = state.reviewItems.findIndex((item) => item.id === itemId);

    if (index === -1) {
      throw new Error("Review item not found");
    }

    const reviewedAt = new Date();
    const updated = applyReviewUpdate(state.reviewItems[index], grade, reviewedAt, sessionType, options);
    state.reviewItems[index] = updated;
    state.reviewLogs.unshift(buildReviewLog(updated, grade, reviewedAt, sessionType, options));
    await persistPerformance(updated);
    return updated;
  }
}

export function deriveStats(state: AppState) {
  const dueCount = state.reviewItems.filter((item) => new Date(item.dueDate).getTime() <= Date.now()).length;
  const masteredCount = state.reviewItems.filter((item) => item.intervalDays >= 4).length;
  const weakItems = [...state.reviewItems]
    .sort((a, b) => {
      const reinforcementDelta = Number(b.needsReinforcement) - Number(a.needsReinforcement);
      if (reinforcementDelta !== 0) {
        return reinforcementDelta;
      }

      return b.lapseCount - a.lapseCount;
    })
    .slice(0, 3);
  const formalReviews = state.reviewLogs.filter((log) => log.sessionType === "formal" || log.sessionType === "warmup").length;
  const extraReviews = state.reviewLogs.filter((log) => log.sessionType === "extra").length;
  const diagnosticReviews = state.reviewLogs.filter((log) => log.sessionType === "diagnostic").length;

  return {
    dueCount,
    masteredCount,
    weakItems,
    streak: state.streak,
    completedDays: Math.max(0, state.currentDay - 1),
    planDays: state.plan.length,
    totalReviews: state.reviewLogs.length,
    formalReviews,
    extraReviews,
    diagnosticReviews,
  };
}

export function deriveRetentionScore(state: AppState) {
  if (state.reviewItems.length === 0) {
    return 0;
  }

  const total = state.reviewItems.reduce(
    (sum, item) =>
      sum +
      Math.min(
        100,
        35 +
          item.intervalDays * 8 +
          item.repetitionCount * 6 -
          item.lapseCount * 8 +
          (item.lastOutcome === "easy" ? 4 : item.lastOutcome === "good" ? 2 : 0),
      ),
    0,
  );

  return Math.round(total / state.reviewItems.length);
}

export function deriveLearningTypeBreakdown(state: AppState) {
  const entries = new Map<LearningType, { attempts: number; correct: number }>();

  state.reviewLogs.forEach((log) => {
    if (!log.learningType) {
      return;
    }

    const current = entries.get(log.learningType) ?? { attempts: 0, correct: 0 };
    current.attempts += 1;
    current.correct += log.outcome === "correct" ? 1 : 0;
    entries.set(log.learningType, current);
  });

  return [...entries.entries()]
    .map(([learningType, stats]) => ({
      learningType,
      attempts: stats.attempts,
      accuracy: stats.attempts > 0 ? stats.correct / stats.attempts : 0,
    }))
    .sort((a, b) => a.accuracy - b.accuracy);
}

export function deriveLessonHotspots(state: AppState) {
  const aggregates = new Map<string, { lessonId: string; misses: number; total: number }>();

  state.reviewLogs.forEach((log) => {
    if (!log.lessonId) {
      return;
    }

    const current = aggregates.get(log.lessonId) ?? { lessonId: log.lessonId, misses: 0, total: 0 };
    current.total += 1;
    current.misses += log.outcome === "incorrect" ? 1 : 0;
    aggregates.set(log.lessonId, current);
  });

  return [...aggregates.values()]
    .map((item) => ({
      ...item,
      lessonTitle: state.plan.find((planDay) => planDay.lessonId === item.lessonId)?.title ?? item.lessonId,
      missRate: item.total > 0 ? item.misses / item.total : 0,
    }))
    .sort((a, b) => b.missRate - a.missRate || b.misses - a.misses)
    .slice(0, 3);
}
