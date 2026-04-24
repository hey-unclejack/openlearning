import { buildCourseState, buildCourseTrack, buildReviewItemsForLesson } from "@/lib/data/curriculum";
import { normalizeAiSettings } from "@/lib/ai/settings";
import { createInitialState } from "@/lib/data/seed";
import {
  legacyLearningTypeForSkill,
  normalizeLearnerProfile,
  normalizeLearningDomain,
  normalizeSkillDimension,
} from "@/lib/learning-goals";
import {
  DEFAULT_LEARNER_ID,
  assignGoalToLearner,
  getActiveLearner,
  makeAssignedGoalFromTemplate,
  makeChildLearner,
  makeClassGoalTemplate,
  makeId,
  normalizeLearnerSpaces,
} from "@/lib/learner-spaces";
import { recordLearningPerformance } from "@/lib/practice-performance";
import { updateReviewItem } from "@/lib/srs";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { hashSupervisorPin, verifySupervisorPinHash } from "@/lib/supervisor-pin";
import {
  AppState,
  AccountMode,
  AIProviderConnection,
  AISettings,
  AIUsageLog,
  ClassEnrollment,
  ClassGoalTemplate,
  ClassInvite,
  Classroom,
  CourseLesson,
  GeneratedLearningPlan,
  GeneratedPlanDay,
  LearningSource,
  LearnerProfile,
  LearningFocus,
  LearningType,
  LearningGoal,
  LearningDomain,
  LearnerSpace,
  SkillDimension,
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
  account_mode?: AppState["accountMode"] | null;
  supervisor_pin_hash?: string | null;
  active_learner_id?: string | null;
  learners?: LearnerSpace[] | null;
  target_language: string;
  native_language: string;
  level: LearnerProfile["level"];
  daily_minutes: number;
  focus: string;
  active_goal_id?: string | null;
  goals?: LearningGoal[] | null;
};

type ReviewItemRow = {
  review_item_id: string;
  front: string;
  back: string;
  hint: string;
  tags: string[];
  lesson_id?: string | null;
  unit_id?: string | null;
  learner_id?: string | null;
  goal_id?: string | null;
  domain?: LearningDomain | null;
  skill_dimension?: SkillDimension | null;
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
  learner_id?: string | null;
  goal_id?: string | null;
  domain?: LearningDomain | null;
  skill_dimension?: SkillDimension | null;
  learning_type?: LearningType | null;
  outcome?: "correct" | "incorrect" | null;
};

type LearningSourceRow = {
  source_id: string;
  source_type: LearningSource["type"];
  learner_id?: string | null;
  goal_id?: string | null;
  domain?: LearningSource["domain"] | null;
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
  learner_id?: string | null;
  goal_id?: string | null;
  domain?: GeneratedLearningPlan["domain"] | null;
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

type ClassroomRow = {
  classroom_id: string;
  teacher_account_id: string;
  title: string;
  school_name?: string | null;
  grade_band?: string | null;
  archived_at?: string | null;
  created_at: string;
};

type ClassGoalTemplateRow = {
  template_id: string;
  classroom_id: string;
  source_goal_id: string;
  title: string;
  domain: LearningDomain;
  subject?: string | null;
  level: LearningGoal["level"];
  purpose: LearningGoal["purpose"];
  daily_minutes: number;
  template_version: number;
  sync_policy: ClassGoalTemplate["syncPolicy"];
  metadata?: Record<string, string | number | boolean> | null;
  created_at: string;
  updated_at?: string | null;
};

type ClassInviteRow = {
  invite_id: string;
  classroom_id: string;
  template_id: string;
  code: string;
  status: ClassInvite["status"];
  expires_at?: string | null;
  created_at: string;
};

type ClassEnrollmentRow = {
  enrollment_id: string;
  classroom_id: string;
  template_id: string;
  parent_account_id: string;
  child_learner_id: string;
  assigned_goal_id: string;
  status: ClassEnrollment["status"];
  joined_at: string;
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

function findLocalClassInviteByCode(code: string) {
  for (const [sessionId, state] of getLocalStateMap()) {
    const invite = state.classInvites.find((item) => item.code === code);
    if (invite) {
      return { sessionId, state, invite };
    }
  }

  return null;
}

function cloneGeneratedPlansForAssignedGoal(params: {
  plans: GeneratedLearningPlan[];
  sourceGoalId: string;
  assignedGoalId: string;
  childLearnerId: string;
}) {
  const createdAt = new Date().toISOString();

  return params.plans
    .filter((plan) => plan.goalId === params.sourceGoalId)
    .map((plan) => ({
      ...plan,
      id: `${plan.id}-copy-${params.childLearnerId}`,
      sourceId: `${plan.sourceId}-copy-${params.childLearnerId}`,
      learnerId: params.childLearnerId,
      goalId: params.assignedGoalId,
      status: "active" as const,
      createdAt,
      days: plan.days.map((day) => ({
        ...day,
        id: `${day.id}-copy-${params.childLearnerId}`,
        lessonId: `${day.lessonId}-copy-${params.childLearnerId}`,
        completedAt: undefined,
        asset: {
          ...day.asset,
          id: `${day.asset.id}-copy-${params.childLearnerId}`,
          unitId: `${day.asset.unitId}-copy-${params.childLearnerId}`,
          reviewSeeds: day.asset.reviewSeeds.map((seed) => ({
            ...seed,
            id: `${seed.id}-copy-${params.childLearnerId}`,
            tags: [...new Set([...seed.tags, "class-assigned"])],
          })),
          practice: day.asset.practice.map((question) => ({
            ...question,
            id: `${question.id}-copy-${params.childLearnerId}`,
          })),
        },
      })),
    }));
}

function mergeAssignedGeneratedPlans(existingPlans: GeneratedLearningPlan[], copiedPlans: GeneratedLearningPlan[]) {
  const copiedById = new Map(copiedPlans.map((plan) => [plan.id, plan]));
  const mergedExisting = existingPlans.map((plan) => {
    const replacement = copiedById.get(plan.id);

    if (!replacement) {
      return plan;
    }

    copiedById.delete(plan.id);
    const hasStarted = plan.days.some((day) => Boolean(day.completedAt));
    return hasStarted ? plan : replacement;
  });

  return [...copiedById.values(), ...mergedExisting];
}

function updateLearnerAssignedGoal(learner: LearnerSpace, enrollment: ClassEnrollment, template: ClassGoalTemplate) {
  const goals = learner.profile.goals ?? [];
  const updatedGoals = goals.map((goal) =>
    goal.id === enrollment.assignedGoalId
      ? {
          ...goal,
          title: template.title,
          domain: template.domain,
          subject: template.subject,
          level: template.level,
          purpose: template.purpose,
          dailyMinutes: template.dailyMinutes,
          metadata: template.metadata,
          templateVersion: template.templateVersion,
          updatedAt: template.updatedAt ?? new Date().toISOString(),
          managedByTeacher: true,
        }
      : goal,
  );

  return {
    ...learner,
    profile: normalizeLearnerProfile({
      ...learner.profile,
      goals: updatedGoals,
      activeGoalId: learner.profile.activeGoalId ?? enrollment.assignedGoalId,
    }),
    updatedAt: new Date().toISOString(),
  };
}

function profileToRow(sessionId: string, state: AppState): ProfileRow {
  const profile = normalizeLearnerProfile(state.profile ?? createInitialState().profile!);

  return {
    session_id: sessionId,
    onboarded: state.onboarded,
    streak: state.streak,
    current_day: state.currentDay,
    account_mode: state.accountMode ?? "supervisor",
    supervisor_pin_hash: state.supervisorPinHash ?? null,
    active_learner_id: state.activeLearnerId ?? DEFAULT_LEARNER_ID,
    learners: state.learners ?? [],
    target_language: profile.targetLanguage,
    native_language: profile.nativeLanguage,
    level: profile.level,
    daily_minutes: profile.dailyMinutes,
    focus: profile.focus,
    active_goal_id: profile.activeGoalId,
    goals: profile.goals,
  };
}

function reviewItemFromRow(row: ReviewItemRow): ReviewItem {
  const domain = row.domain ?? normalizeLearningDomain(row.learning_type);
  const skillDimension = normalizeSkillDimension(row.skill_dimension ?? row.learning_type, domain);

  return {
    id: row.review_item_id,
    front: row.front,
    back: row.back,
    hint: row.hint,
    tags: row.tags,
    lessonId: row.lesson_id ?? "legacy-lesson",
    unitId: row.unit_id ?? "legacy-unit",
    goalId: row.goal_id ?? undefined,
    learnerId: row.learner_id ?? DEFAULT_LEARNER_ID,
    domain,
    skillDimension,
    learningType: row.learning_type ?? legacyLearningTypeForSkill(skillDimension),
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
    learner_id: item.learnerId ?? DEFAULT_LEARNER_ID,
    goal_id: item.goalId ?? null,
    domain: item.domain ?? null,
    skill_dimension: item.skillDimension,
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
  const domain = row.domain ?? normalizeLearningDomain(row.learning_type);
  const skillDimension = row.skill_dimension ?? (row.learning_type ? normalizeSkillDimension(row.learning_type, domain) : undefined);

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
    goalId: row.goal_id ?? undefined,
    learnerId: row.learner_id ?? DEFAULT_LEARNER_ID,
    domain,
    skillDimension,
    learningType: row.learning_type ?? undefined,
    outcome: row.outcome ?? undefined,
  };
}

function learningSourceFromRow(row: LearningSourceRow): LearningSource {
  const domain = row.domain ?? normalizeLearningDomain(row.subject);

  return {
    id: row.source_id,
    type: row.source_type,
    learnerId: row.learner_id ?? DEFAULT_LEARNER_ID,
    goalId: row.goal_id ?? undefined,
    domain,
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
  const domain = row.domain ?? normalizeLearningDomain(row.subject);

  return {
    id: row.generated_plan_id,
    sourceId: row.source_id,
    learnerId: row.learner_id ?? DEFAULT_LEARNER_ID,
    goalId: row.goal_id ?? undefined,
    domain,
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
    learner_id: source.learnerId ?? DEFAULT_LEARNER_ID,
    goal_id: source.goalId ?? null,
    domain: source.domain,
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
    learner_id: plan.learnerId ?? DEFAULT_LEARNER_ID,
    goal_id: plan.goalId ?? null,
    domain: plan.domain,
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

function classroomFromRow(row: ClassroomRow): Classroom {
  return {
    id: row.classroom_id,
    teacherAccountId: row.teacher_account_id,
    title: row.title,
    schoolName: row.school_name ?? undefined,
    gradeBand: row.grade_band ?? undefined,
    archivedAt: row.archived_at ?? undefined,
    createdAt: row.created_at,
  };
}

function classroomToRow(sessionId: string, classroom: Classroom) {
  return {
    session_id: sessionId,
    classroom_id: classroom.id,
    teacher_account_id: classroom.teacherAccountId,
    title: classroom.title,
    school_name: classroom.schoolName ?? null,
    grade_band: classroom.gradeBand ?? null,
    archived_at: classroom.archivedAt ?? null,
    created_at: classroom.createdAt,
  };
}

function classGoalTemplateFromRow(row: ClassGoalTemplateRow): ClassGoalTemplate {
  return {
    id: row.template_id,
    classroomId: row.classroom_id,
    sourceGoalId: row.source_goal_id,
    title: row.title,
    domain: row.domain,
    subject: row.subject ?? undefined,
    level: row.level,
    purpose: row.purpose,
    dailyMinutes: row.daily_minutes,
    templateVersion: row.template_version,
    syncPolicy: row.sync_policy,
    metadata: row.metadata ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined,
  };
}

function classGoalTemplateToRow(sessionId: string, template: ClassGoalTemplate) {
  return {
    session_id: sessionId,
    template_id: template.id,
    classroom_id: template.classroomId,
    source_goal_id: template.sourceGoalId,
    title: template.title,
    domain: template.domain,
    subject: template.subject ?? null,
    level: template.level,
    purpose: template.purpose,
    daily_minutes: template.dailyMinutes,
    template_version: template.templateVersion,
    sync_policy: template.syncPolicy,
    metadata: template.metadata ?? {},
    created_at: template.createdAt,
    updated_at: template.updatedAt ?? template.createdAt,
  };
}

function classInviteFromRow(row: ClassInviteRow): ClassInvite {
  return {
    id: row.invite_id,
    classroomId: row.classroom_id,
    templateId: row.template_id,
    code: row.code,
    status: row.status,
    expiresAt: row.expires_at ?? undefined,
    createdAt: row.created_at,
  };
}

function classInviteToRow(sessionId: string, invite: ClassInvite) {
  return {
    session_id: sessionId,
    invite_id: invite.id,
    classroom_id: invite.classroomId,
    template_id: invite.templateId,
    code: invite.code,
    status: invite.status,
    expires_at: invite.expiresAt ?? null,
    created_at: invite.createdAt,
  };
}

function classEnrollmentFromRow(row: ClassEnrollmentRow): ClassEnrollment {
  return {
    id: row.enrollment_id,
    classroomId: row.classroom_id,
    templateId: row.template_id,
    parentAccountId: row.parent_account_id,
    childLearnerId: row.child_learner_id,
    assignedGoalId: row.assigned_goal_id,
    status: row.status,
    joinedAt: row.joined_at,
  };
}

function classEnrollmentToRow(sessionId: string, enrollment: ClassEnrollment) {
  return {
    session_id: sessionId,
    enrollment_id: enrollment.id,
    classroom_id: enrollment.classroomId,
    template_id: enrollment.templateId,
    parent_account_id: enrollment.parentAccountId,
    child_learner_id: enrollment.childLearnerId,
    assigned_goal_id: enrollment.assignedGoalId,
    status: enrollment.status,
    joined_at: enrollment.joinedAt,
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
    classrooms?: ClassroomRow[];
    classGoalTemplates?: ClassGoalTemplateRow[];
    classInvites?: ClassInviteRow[];
    classEnrollments?: ClassEnrollmentRow[];
  },
): AppState {
  const localAiState = getLocalAiState(profile.session_id);
  const learnerState = normalizeLearnerSpaces({
    activeLearnerId: profile.active_learner_id ?? undefined,
    learners: profile.learners ?? undefined,
    profile: normalizeLearnerProfile({
      activeGoalId: profile.active_goal_id ?? undefined,
      goals: profile.goals ?? undefined,
      targetLanguage: profile.target_language as TargetLanguage,
      nativeLanguage: profile.native_language as NativeLanguage,
      level: profile.level as ProficiencyLevel,
      dailyMinutes: profile.daily_minutes,
      focus: profile.focus as LearningFocus,
    }),
  });

  return buildCourseState({
    onboarded: profile.onboarded,
    streak: profile.streak,
    accountMode: profile.account_mode ?? "supervisor",
    supervisorPinHash: profile.supervisor_pin_hash ?? localAiState.supervisorPinHash,
    activeLearnerId: learnerState.activeLearnerId,
    learners: learnerState.learners,
    currentDay: profile.current_day,
    profile: learnerState.profile,
    reviewItems: reviewItemRows.map(reviewItemFromRow),
    reviewLogs: reviewLogRows.map(reviewLogFromRow),
    learningSources: aiRows?.learningSources.map(learningSourceFromRow) ?? localAiState.learningSources,
    generatedPlans: aiRows?.generatedPlans.map(generatedPlanFromRow) ?? localAiState.generatedPlans,
    aiSettings: aiRows?.aiSettings ? aiSettingsFromRow(aiRows.aiSettings) : localAiState.aiSettings,
    aiProviderConnections: aiRows?.aiProviderConnections.map(aiProviderConnectionFromRow) ?? localAiState.aiProviderConnections,
    aiUsageLogs: aiRows?.aiUsageLogs.map(aiUsageLogFromRow) ?? localAiState.aiUsageLogs,
    classrooms: aiRows?.classrooms?.map(classroomFromRow) ?? localAiState.classrooms,
    classGoalTemplates: aiRows?.classGoalTemplates?.map(classGoalTemplateFromRow) ?? localAiState.classGoalTemplates,
    classInvites: aiRows?.classInvites?.map(classInviteFromRow) ?? localAiState.classInvites,
    classEnrollments: aiRows?.classEnrollments?.map(classEnrollmentFromRow) ?? localAiState.classEnrollments,
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
    supervisorPinHash: state?.supervisorPinHash,
    classrooms: state?.classrooms ?? [],
    classGoalTemplates: state?.classGoalTemplates ?? [],
    classInvites: state?.classInvites ?? [],
    classEnrollments: state?.classEnrollments ?? [],
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
      | "accountMode"
      | "supervisorPinHash"
      | "activeLearnerId"
      | "learners"
      | "profile"
      | "currentDay"
      | "reviewItems"
      | "reviewLogs"
      | "learningSources"
      | "generatedPlans"
      | "aiSettings"
      | "aiProviderConnections"
      | "aiUsageLogs"
      | "classrooms"
      | "classGoalTemplates"
      | "classInvites"
      | "classEnrollments"
    >
  >,
) {
  return buildCourseState({
    onboarded: overrides.onboarded ?? state.onboarded,
    streak: overrides.streak ?? state.streak,
    accountMode: overrides.accountMode ?? state.accountMode,
    supervisorPinHash: overrides.supervisorPinHash ?? state.supervisorPinHash,
    activeLearnerId: overrides.activeLearnerId ?? state.activeLearnerId,
    learners: overrides.learners ?? state.learners,
    profile: overrides.profile ?? state.profile ?? createInitialState().profile!,
    currentDay: overrides.currentDay ?? state.currentDay,
    reviewItems: overrides.reviewItems ?? state.reviewItems,
    reviewLogs: overrides.reviewLogs ?? state.reviewLogs,
    learningSources: overrides.learningSources ?? state.learningSources,
    generatedPlans: overrides.generatedPlans ?? state.generatedPlans,
    aiSettings: overrides.aiSettings ?? state.aiSettings,
    aiProviderConnections: overrides.aiProviderConnections ?? state.aiProviderConnections,
    aiUsageLogs: overrides.aiUsageLogs ?? state.aiUsageLogs,
    classrooms: overrides.classrooms ?? state.classrooms,
    classGoalTemplates: overrides.classGoalTemplates ?? state.classGoalTemplates,
    classInvites: overrides.classInvites ?? state.classInvites,
    classEnrollments: overrides.classEnrollments ?? state.classEnrollments,
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

function getActiveScope(state: AppState) {
  const activeLearner = getActiveLearner(state);
  const activeGoalId = activeLearner?.profile.activeGoalId;

  return {
    learnerId: activeLearner?.id ?? DEFAULT_LEARNER_ID,
    goalId: activeGoalId,
  };
}

function itemMatchesScope(item: { learnerId?: string; goalId?: string; domain?: LearningDomain }, scope: { learnerId: string; goalId?: string }) {
  const learnerMatches = (item.learnerId ?? DEFAULT_LEARNER_ID) === scope.learnerId;
  const goalMatches = scope.goalId ? !item.goalId || item.goalId === scope.goalId : true;

  return learnerMatches && goalMatches;
}

function getScopedReviewItems(state: AppState) {
  const scope = getActiveScope(state);
  return state.reviewItems.filter((item) => itemMatchesScope(item, scope));
}

function getScopedReviewLogs(state: AppState) {
  const scope = getActiveScope(state);
  return state.reviewLogs.filter((log) => itemMatchesScope(log, scope));
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
    learnerId: item.learnerId,
    goalId: item.goalId,
    domain: item.domain,
    skillDimension: item.skillDimension,
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
  const scopedItems = getScopedReviewItems(state);
  const dueItems = scopedItems.filter((item) => new Date(item.dueDate).getTime() <= Date.now());
  const must = dueItems
    .filter((item) => getOverdueDays(item) >= 1 || item.lapseCount >= 2 || item.needsReinforcement)
    .sort(sortReviewPriority);
  const should = dueItems
    .filter((item) => !must.some((mustItem) => mustItem.id === item.id))
    .sort(sortReviewPriority);

  const canCandidates = scopedItems
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
      const [sources, plans, settings, connections, usageLogs, classrooms, templates, invites, enrollments] = await Promise.all([
        client.from("learning_sources").select("*").eq("session_id", sessionId).order("created_at", { ascending: false }).limit(30),
        client.from("generated_plans").select("*").eq("session_id", sessionId).order("created_at", { ascending: false }).limit(20),
        client.from("ai_settings").select("*").eq("session_id", sessionId).maybeSingle(),
        client.from("ai_provider_connections").select("*").eq("session_id", sessionId),
        client.from("ai_usage_logs").select("*").eq("session_id", sessionId).order("created_at", { ascending: false }).limit(200),
        client.from("classrooms").select("*").eq("session_id", sessionId).order("created_at", { ascending: false }),
        client.from("class_goal_templates").select("*").eq("session_id", sessionId).order("created_at", { ascending: false }),
        client.from("class_invites").select("*").eq("session_id", sessionId).order("created_at", { ascending: false }),
        client.from("class_enrollments").select("*").eq("session_id", sessionId).order("joined_at", { ascending: false }),
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
        classrooms: classrooms.error ? undefined : classrooms.data as unknown as ClassroomRow[],
        classGoalTemplates: templates.error ? undefined : templates.data as unknown as ClassGoalTemplateRow[],
        classInvites: invites.error ? undefined : invites.data as unknown as ClassInviteRow[],
        classEnrollments: enrollments.error ? undefined : enrollments.data as unknown as ClassEnrollmentRow[],
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
  const learnerState = normalizeLearnerSpaces({
    profile,
    activeLearnerId: currentState.activeLearnerId,
    learners: currentState.learners,
  });
  const learners = learnerState.learners.map((learner) =>
    learner.id === learnerState.activeLearnerId
      ? { ...learner, profile: normalizeLearnerProfile(profile), updatedAt: new Date().toISOString() }
      : learner,
  );
  const nextState = rebuildState(currentState, {
    onboarded: true,
    activeLearnerId: learnerState.activeLearnerId,
    learners,
    profile: normalizeLearnerProfile(profile),
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

  const activeLearnerId = state.activeLearnerId ?? DEFAULT_LEARNER_ID;
  const newReviewItems = buildReviewItemsForLesson(courseLesson).map((item) => ({
    ...item,
    learnerId: activeLearnerId,
  })).filter(
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
    goalId: plan.goalId,
    domain: plan.domain,
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
  const newReviewItems = buildReviewItemsForLesson(courseLesson).map((item) => ({
    ...item,
    learnerId: plan.learnerId ?? state.activeLearnerId ?? DEFAULT_LEARNER_ID,
  })).filter(
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

async function persistProfileState(sessionId: string, state: AppState) {
  const client = getSupabaseAdminClient();

  if (!client) {
    replaceLocalState(sessionId, state);
    return;
  }

  try {
    await ensureSupabaseState(sessionId);
    await client.from("learner_profiles").upsert(
      {
        ...profileToRow(sessionId, state),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "session_id" },
    );
  } catch {
    // Local state remains authoritative when optional profile columns are not migrated yet.
  }

  replaceLocalState(sessionId, state);
}

async function persistClassState(sessionId: string, state: AppState) {
  const client = getSupabaseAdminClient();

  replaceLocalState(sessionId, state);

  if (!client) {
    return;
  }

  try {
    await ensureSupabaseState(sessionId);
    await Promise.all([
      ...state.classrooms.map((classroom) =>
        client.from("classrooms").upsert(classroomToRow(sessionId, classroom), { onConflict: "session_id,classroom_id" }),
      ),
      ...state.classGoalTemplates.map((template) =>
        client.from("class_goal_templates").upsert(classGoalTemplateToRow(sessionId, template), { onConflict: "session_id,template_id" }),
      ),
      ...state.classInvites.map((invite) =>
        client.from("class_invites").upsert(classInviteToRow(sessionId, invite), { onConflict: "session_id,invite_id" }),
      ),
      ...state.classEnrollments.map((enrollment) =>
        client.from("class_enrollments").upsert(classEnrollmentToRow(sessionId, enrollment), { onConflict: "session_id,enrollment_id" }),
      ),
    ]);
  } catch {
    // Class tables are optional during local migration rollout.
  }
}

async function persistGeneratedPlans(sessionId: string, plans: GeneratedLearningPlan[]) {
  const client = getSupabaseAdminClient();

  if (!client) {
    return;
  }

  try {
    await ensureSupabaseState(sessionId);
    await Promise.all(
      plans.map((plan) =>
        client.from("generated_plans").upsert(generatedPlanToRow(sessionId, plan), { onConflict: "session_id,generated_plan_id" }),
      ),
    );
  } catch {
    // Local state remains usable when generated plan persistence is unavailable.
  }
}

export async function createClassroom(sessionId: string, params: { title: string; schoolName?: string; gradeBand?: string }) {
  const state = await readState(sessionId);
  const createdAt = new Date().toISOString();
  const classroom: Classroom = {
    id: makeId("class", params.title),
    teacherAccountId: sessionId,
    title: params.title.trim() || "Classroom",
    schoolName: params.schoolName?.trim() || undefined,
    gradeBand: params.gradeBand?.trim() || undefined,
    createdAt,
  };
  const nextState = rebuildState(state, {
    classrooms: [classroom, ...state.classrooms.filter((item) => item.id !== classroom.id)],
  });

  await persistClassState(sessionId, nextState);
  return classroom;
}

export async function createClassGoalTemplate(sessionId: string, classroomId: string, params: { goalId?: string; title?: string }) {
  const state = await readState(sessionId);
  const classroom = state.classrooms.find((item) => item.id === classroomId);
  const activeGoal = getActiveLearner(state)?.profile.goals?.find((goal) => goal.id === params.goalId)
    ?? getActiveLearner(state)?.profile.goals?.find((goal) => goal.id === getActiveLearner(state)?.profile.activeGoalId)
    ?? state.profile?.goals?.[0];

  if (!classroom || !activeGoal) {
    return null;
  }

  const template = {
    ...makeClassGoalTemplate({ classroomId, goal: activeGoal }),
    title: params.title?.trim() || activeGoal.title,
  };
  const nextState = rebuildState(state, {
    classGoalTemplates: [template, ...state.classGoalTemplates.filter((item) => item.id !== template.id)],
  });

  await persistClassState(sessionId, nextState);
  return template;
}

export async function createClassInvite(sessionId: string, classroomId: string, templateId: string, params: { expiresAt?: string } = {}) {
  const state = await readState(sessionId);
  const classroom = state.classrooms.find((item) => item.id === classroomId);
  const template = state.classGoalTemplates.find((item) => item.id === templateId);

  if (!classroom || !template) {
    return null;
  }

  const code = `${classroomId.replace(/^class-/, "").slice(0, 10)}-${Math.random().toString(36).slice(2, 8)}`;
  const invite: ClassInvite = {
    id: makeId("invite", code),
    classroomId,
    templateId,
    code,
    status: "active",
    expiresAt: params.expiresAt,
    createdAt: new Date().toISOString(),
  };
  const nextState = rebuildState(state, {
    classInvites: [invite, ...state.classInvites.filter((item) => item.id !== invite.id)],
  });

  await persistClassState(sessionId, nextState);
  return invite;
}

export async function findClassInvite(code: string) {
  const normalizedCode = code.trim();
  const client = getSupabaseAdminClient();

  if (client) {
    try {
      const { data: inviteRow } = await client.from("class_invites").select("*").eq("code", normalizedCode).eq("status", "active").maybeSingle();
      if (inviteRow) {
        const sessionId = String((inviteRow as { session_id: string }).session_id);
        const state = await readState(sessionId);
        const invite = classInviteFromRow(inviteRow as unknown as ClassInviteRow);
        const classroom = state.classrooms.find((item) => item.id === invite.classroomId);
        const template = state.classGoalTemplates.find((item) => item.id === invite.templateId);
        return classroom && template ? { teacherSessionId: sessionId, classroom, template, invite } : null;
      }
    } catch {
      // Fall through to local lookup.
    }
  }

  const local = findLocalClassInviteByCode(normalizedCode);
  if (!local || local.invite.status !== "active") {
    return null;
  }

  const classroom = local.state.classrooms.find((item) => item.id === local.invite.classroomId);
  const template = local.state.classGoalTemplates.find((item) => item.id === local.invite.templateId);

  return classroom && template
    ? { teacherSessionId: local.sessionId, classroom, template, invite: local.invite }
    : null;
}

export async function acceptClassInvite(sessionId: string, code: string, params: { childLearnerId?: string; childName?: string }) {
  const inviteContext = await findClassInvite(code);
  const parentState = await readState(sessionId);

  if (!inviteContext) {
    return null;
  }

  const now = new Date().toISOString();
  const currentLearners = parentState.learners ?? [];
  const baseProfile = parentState.profile ?? createInitialState().profile!;
  const childLearner = params.childLearnerId
    ? currentLearners.find((learner) => learner.id === params.childLearnerId)
    : undefined;
  const nextChildLearner = childLearner ?? makeChildLearner(params.childName?.trim() || "Child learner", baseProfile);
  const assignedGoal = makeAssignedGoalFromTemplate(inviteContext.template, nextChildLearner);
  const updatedChild = assignGoalToLearner(nextChildLearner, assignedGoal);
  const enrollment: ClassEnrollment = {
    id: makeId("enrollment", `${inviteContext.classroom.id}-${updatedChild.id}-${assignedGoal.id}`),
    classroomId: inviteContext.classroom.id,
    templateId: inviteContext.template.id,
    parentAccountId: sessionId,
    childLearnerId: updatedChild.id,
    assignedGoalId: assignedGoal.id,
    status: "active",
    joinedAt: now,
  };
  const teacherState = await readState(inviteContext.teacherSessionId);
  const copiedPlans = cloneGeneratedPlansForAssignedGoal({
    plans: teacherState.generatedPlans,
    sourceGoalId: inviteContext.template.sourceGoalId,
    assignedGoalId: assignedGoal.id,
    childLearnerId: updatedChild.id,
  });
  const parentNext = rebuildState(parentState, {
    activeLearnerId: updatedChild.id,
    learners: [updatedChild, ...currentLearners.filter((learner) => learner.id !== updatedChild.id)],
    profile: updatedChild.profile,
    generatedPlans: [...copiedPlans, ...parentState.generatedPlans],
    classEnrollments: [enrollment, ...parentState.classEnrollments.filter((item) => item.id !== enrollment.id)],
  });
  const teacherNext = rebuildState(teacherState, {
    classEnrollments: [enrollment, ...teacherState.classEnrollments.filter((item) => item.id !== enrollment.id)],
  });

  await persistClassState(sessionId, parentNext);
  if (inviteContext.teacherSessionId !== sessionId) {
    await persistClassState(inviteContext.teacherSessionId, teacherNext);
  }

  return {
    classroom: inviteContext.classroom,
    template: inviteContext.template,
    enrollment,
    learner: updatedChild,
    goal: assignedGoal,
  };
}

export async function getClassSummary(sessionId: string, classroomId: string) {
  const state = await readState(sessionId);
  const classroom = state.classrooms.find((item) => item.id === classroomId);

  if (!classroom) {
    return null;
  }

  const enrollments = state.classEnrollments.filter((item) => item.classroomId === classroomId && item.status === "active");
  const templates = state.classGoalTemplates.filter((item) => item.classroomId === classroomId);
  const invites = state.classInvites.filter((item) => item.classroomId === classroomId && item.status === "active");

  return {
    classroom,
    templates,
    invites,
    enrollments,
    joinedCount: enrollments.length,
    activeInviteCount: invites.length,
    templateCount: templates.length,
  };
}

export async function syncClassTemplate(sessionId: string, classroomId: string, templateId: string) {
  const state = await readState(sessionId);
  const template = state.classGoalTemplates.find((item) => item.id === templateId && item.classroomId === classroomId);

  if (!template) {
    return null;
  }

  const updatedTemplate: ClassGoalTemplate = {
    ...template,
    templateVersion: template.templateVersion + 1,
    updatedAt: new Date().toISOString(),
  };
  const activeEnrollments = state.classEnrollments.filter(
    (enrollment) =>
      enrollment.classroomId === classroomId &&
      enrollment.templateId === templateId &&
      enrollment.status === "active",
  );
  const nextState = rebuildState(state, {
    classGoalTemplates: state.classGoalTemplates.map((item) => item.id === templateId ? updatedTemplate : item),
  });

  await persistClassState(sessionId, nextState);

  let syncedChildGoalCount = 0;
  let syncedPlanCount = 0;

  for (const enrollment of activeEnrollments) {
    const parentState = await readState(enrollment.parentAccountId);
    const childLearner = parentState.learners?.find((learner) => learner.id === enrollment.childLearnerId && !learner.archivedAt);

    if (!childLearner) {
      continue;
    }

    const updatedChild = updateLearnerAssignedGoal(childLearner, enrollment, updatedTemplate);
    const copiedPlans = cloneGeneratedPlansForAssignedGoal({
      plans: nextState.generatedPlans,
      sourceGoalId: updatedTemplate.sourceGoalId,
      assignedGoalId: enrollment.assignedGoalId,
      childLearnerId: enrollment.childLearnerId,
    });
    const mergedPlans = mergeAssignedGeneratedPlans(parentState.generatedPlans, copiedPlans);
    const nextParentState = rebuildState(parentState, {
      activeLearnerId: parentState.activeLearnerId,
      learners: (parentState.learners ?? []).map((learner) => learner.id === updatedChild.id ? updatedChild : learner),
      profile: parentState.activeLearnerId === updatedChild.id ? updatedChild.profile : parentState.profile,
      generatedPlans: mergedPlans,
    });

    await persistProfileState(enrollment.parentAccountId, nextParentState);
    await persistGeneratedPlans(enrollment.parentAccountId, mergedPlans.filter((plan) => plan.learnerId === enrollment.childLearnerId));
    syncedChildGoalCount += 1;
    syncedPlanCount += copiedPlans.length;
  }

  return {
    template: updatedTemplate,
    syncedChildGoalCount,
    syncedPlanCount,
  };
}

export async function createSupervisedLearner(sessionId: string, params: { displayName: string }) {
  const state = await readState(sessionId);
  const learner = makeChildLearner(params.displayName.trim() || "Child learner", state.profile ?? createInitialState().profile!);
  const nextState = rebuildState(state, {
    activeLearnerId: learner.id,
    learners: [learner, ...(state.learners ?? []).filter((item) => item.id !== learner.id)],
    profile: learner.profile,
  });

  await persistProfileState(sessionId, nextState);
  return learner;
}

export async function switchActiveLearner(sessionId: string, learnerId: string) {
  const state = await readState(sessionId);
  const learner = state.learners?.find((item) => item.id === learnerId && !item.archivedAt);

  if (!learner) {
    return null;
  }

  const nextState = rebuildState(state, {
    activeLearnerId: learner.id,
    profile: learner.profile,
  });

  await persistProfileState(sessionId, nextState);
  return learner;
}

export async function setSupervisorPin(sessionId: string, pin: string) {
  const state = await readState(sessionId);
  const nextState = rebuildState(state, {
    accountMode: "supervisor",
    supervisorPinHash: hashSupervisorPin(sessionId, pin),
  });

  await persistProfileState(sessionId, nextState);
  return true;
}

export async function verifySupervisorPin(sessionId: string, pin: string) {
  const state = await readState(sessionId);
  return verifySupervisorPinHash(sessionId, pin, state.supervisorPinHash);
}

export async function setAccountMode(sessionId: string, params: { mode: AccountMode; learnerId?: string }) {
  const state = await readState(sessionId);
  let activeLearner = params.learnerId
    ? state.learners?.find((learner) => learner.id === params.learnerId && !learner.archivedAt)
    : getActiveLearner(state);

  if (!activeLearner) {
    return null;
  }

  if (params.mode === "child" && activeLearner.kind !== "supervised-student") {
    activeLearner = state.learners?.find((learner) => learner.kind === "supervised-student" && !learner.archivedAt);
  }

  if (!activeLearner) {
    return null;
  }

  const nextState = rebuildState(state, {
    accountMode: params.mode,
    activeLearnerId: activeLearner.id,
    profile: activeLearner.profile,
  });

  await persistProfileState(sessionId, nextState);
  return {
    mode: nextState.accountMode,
    learner: activeLearner,
  };
}

export async function switchActiveLearningGoal(sessionId: string, goalId: string) {
  const state = await readState(sessionId);
  const activeLearner = getActiveLearner(state);
  const goal = activeLearner?.profile.goals?.find((item) => item.id === goalId && !item.archivedAt);

  if (!activeLearner || !goal) {
    return null;
  }

  const updatedLearner: LearnerSpace = {
    ...activeLearner,
    profile: normalizeLearnerProfile({
      ...activeLearner.profile,
      activeGoalId: goal.id,
      dailyMinutes: goal.dailyMinutes,
      level: goal.level,
    }),
    updatedAt: new Date().toISOString(),
  };
  const nextState = rebuildState(state, {
    learners: (state.learners ?? []).map((learner) => learner.id === updatedLearner.id ? updatedLearner : learner),
    profile: updatedLearner.profile,
  });

  await persistProfileState(sessionId, nextState);
  return goal;
}

export async function getDueReviewItems(sessionId: string) {
  const state = await readState(sessionId);
  return getScopedReviewItems(state).filter((item) => new Date(item.dueDate).getTime() <= Date.now()).sort(sortReviewPriority);
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
  return getScopedReviewItems(state).filter((item) => item.lessonId === lessonId).slice(0, 3);
}

export async function getLessonWarmupItems(sessionId: string, lessonId: string) {
  const state = await readState(sessionId);
  const targetLesson = state.plan.find((item) => item.lessonId === lessonId);

  if (!targetLesson) {
    return [];
  }

  return getScopedReviewItems(state)
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

  const base = getScopedReviewItems(state).filter((item) => completedLessonIds.has(item.lessonId));
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
      learningType: item.skillDimension,
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
      learner_id: updated.learnerId ?? DEFAULT_LEARNER_ID,
      goal_id: updated.goalId ?? null,
      domain: updated.domain ?? null,
      skill_dimension: updated.skillDimension,
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
  const scopedItems = getScopedReviewItems(state);
  const scopedLogs = getScopedReviewLogs(state);
  const dueCount = scopedItems.filter((item) => new Date(item.dueDate).getTime() <= Date.now()).length;
  const masteredCount = scopedItems.filter((item) => item.intervalDays >= 4).length;
  const weakItems = [...scopedItems]
    .sort((a, b) => {
      const reinforcementDelta = Number(b.needsReinforcement) - Number(a.needsReinforcement);
      if (reinforcementDelta !== 0) {
        return reinforcementDelta;
      }

      return b.lapseCount - a.lapseCount;
    })
    .slice(0, 3);
  const formalReviews = scopedLogs.filter((log) => log.sessionType === "formal" || log.sessionType === "warmup").length;
  const extraReviews = scopedLogs.filter((log) => log.sessionType === "extra").length;
  const diagnosticReviews = scopedLogs.filter((log) => log.sessionType === "diagnostic").length;

  return {
    dueCount,
    masteredCount,
    weakItems,
    streak: state.streak,
    completedDays: Math.max(0, state.currentDay - 1),
    planDays: state.plan.length,
    totalReviews: scopedLogs.length,
    formalReviews,
    extraReviews,
    diagnosticReviews,
  };
}

export function deriveRetentionScore(state: AppState) {
  const scopedItems = getScopedReviewItems(state);

  if (scopedItems.length === 0) {
    return 0;
  }

  const total = scopedItems.reduce(
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

  return Math.round(total / scopedItems.length);
}

export function deriveLearningTypeBreakdown(state: AppState) {
  const entries = new Map<SkillDimension, { attempts: number; correct: number }>();

  getScopedReviewLogs(state).forEach((log) => {
    const skillDimension = log.skillDimension ?? (log.learningType ? normalizeSkillDimension(log.learningType, log.domain) : undefined);
    if (!skillDimension) {
      return;
    }

    const current = entries.get(skillDimension) ?? { attempts: 0, correct: 0 };
    current.attempts += 1;
    current.correct += log.outcome === "correct" ? 1 : 0;
    entries.set(skillDimension, current);
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

  getScopedReviewLogs(state).forEach((log) => {
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
