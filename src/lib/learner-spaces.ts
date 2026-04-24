import {
  AppState,
  ClassEnrollment,
  ClassGoalTemplate,
  Classroom,
  ClassInvite,
  LearnerProfile,
  LearnerSpace,
  LearningGoal,
} from "@/lib/types";
import { learningGoalTitle, normalizeLearnerProfile } from "@/lib/learning-goals";

export const DEFAULT_LEARNER_ID = "self";

const defaultSelfRestrictions = {
  learningOnly: false,
  canEditGoals: true,
  canUseAiIntake: true,
};

const defaultChildRestrictions = {
  learningOnly: true,
  canEditGoals: false,
  canUseAiIntake: false,
};

function nowIso() {
  return new Date().toISOString();
}

export function makeId(prefix: string, seed: string) {
  const safeSeed = seed
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/gi, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `${prefix}-${safeSeed || Date.now().toString(36)}`;
}

export function makeSelfLearner(profile: LearnerProfile): LearnerSpace {
  return {
    id: DEFAULT_LEARNER_ID,
    displayName: "Me",
    kind: "self",
    profile: normalizeLearnerProfile(profile),
    restrictions: defaultSelfRestrictions,
    createdAt: nowIso(),
  };
}

export function makeChildLearner(displayName: string, baseProfile: LearnerProfile): LearnerSpace {
  const learnerId = makeId("learner", displayName);
  return {
    id: learnerId,
    displayName,
    kind: "supervised-student",
    supervisorRole: "parent",
    profile: normalizeLearnerProfile({
      ...baseProfile,
      activeGoalId: undefined,
      goals: [],
    }),
    restrictions: defaultChildRestrictions,
    createdAt: nowIso(),
  };
}

export function normalizeLearnerSpaces(params: {
  profile: LearnerProfile;
  activeLearnerId?: string;
  learners?: LearnerSpace[];
}) {
  const selfLearner = makeSelfLearner(params.profile);
  const learners = params.learners && params.learners.length > 0 ? params.learners : [selfLearner];
  const normalizedLearners = learners.map((learner) => ({
    ...learner,
    profile: normalizeLearnerProfile(learner.profile),
    restrictions: learner.restrictions ?? (learner.kind === "self" ? defaultSelfRestrictions : defaultChildRestrictions),
  }));
  const activeLearnerId = params.activeLearnerId && normalizedLearners.some((learner) => learner.id === params.activeLearnerId && !learner.archivedAt)
    ? params.activeLearnerId
    : normalizedLearners.find((learner) => !learner.archivedAt)?.id ?? DEFAULT_LEARNER_ID;
  const activeLearner = normalizedLearners.find((learner) => learner.id === activeLearnerId) ?? normalizedLearners[0] ?? selfLearner;

  return {
    activeLearnerId,
    learners: normalizedLearners,
    activeLearner,
    profile: activeLearner.profile,
  };
}

export function getActiveLearner(state: Pick<AppState, "activeLearnerId" | "learners" | "profile">): LearnerSpace | undefined {
  const normalized = normalizeLearnerSpaces({
    profile: state.profile ?? {
      targetLanguage: "english",
      nativeLanguage: "zh-TW",
      level: "A2",
      dailyMinutes: 15,
      focus: "travel",
    },
    activeLearnerId: state.activeLearnerId,
    learners: state.learners,
  });

  return normalized.activeLearner;
}

export function getLearnerById(state: Pick<AppState, "learners">, learnerId?: string) {
  return state.learners?.find((learner) => learner.id === (learnerId ?? DEFAULT_LEARNER_ID));
}

export function getActiveLearnerGoal(state: Pick<AppState, "activeLearnerId" | "learners" | "profile">): LearningGoal | undefined {
  return getActiveLearner(state)?.profile.goals?.find((goal) => goal.id === getActiveLearner(state)?.profile.activeGoalId)
    ?? getActiveLearner(state)?.profile.goals?.[0];
}

export function assignGoalToLearner(learner: LearnerSpace, goal: LearningGoal) {
  const goals = learner.profile.goals ?? [];
  const nextGoal = {
    ...goal,
    ownerLearnerId: learner.id,
    updatedAt: nowIso(),
  };

  return {
    ...learner,
    profile: normalizeLearnerProfile({
      ...learner.profile,
      activeGoalId: nextGoal.id,
      goals: [nextGoal, ...goals.filter((item) => item.id !== nextGoal.id)],
      dailyMinutes: nextGoal.dailyMinutes,
      level: nextGoal.level,
      focus: nextGoal.purpose === "travel" || nextGoal.purpose === "daily" || nextGoal.purpose === "work" || nextGoal.purpose === "exam"
        ? nextGoal.purpose
        : learner.profile.focus,
    }),
    updatedAt: nowIso(),
  };
}

export function makeAssignedGoalFromTemplate(template: ClassGoalTemplate, learner: LearnerSpace): LearningGoal {
  return {
    id: makeId("goal", `${learner.id}-${template.id}`),
    ownerLearnerId: learner.id,
    domain: template.domain,
    title: template.title,
    subject: template.subject,
    level: template.level,
    purpose: template.purpose,
    dailyMinutes: template.dailyMinutes,
    metadata: template.metadata,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    templateId: template.id,
    classroomId: template.classroomId,
    templateVersion: template.templateVersion,
    managedByTeacher: true,
  };
}

export function makeClassGoalTemplate(params: {
  classroomId: string;
  goal: LearningGoal;
}) {
  const createdAt = nowIso();
  return {
    id: makeId("template", `${params.classroomId}-${params.goal.id}`),
    classroomId: params.classroomId,
    sourceGoalId: params.goal.id,
    title: params.goal.title || learningGoalTitle(params.goal),
    domain: params.goal.domain,
    subject: params.goal.subject,
    level: params.goal.level,
    purpose: params.goal.purpose,
    dailyMinutes: params.goal.dailyMinutes,
    templateVersion: 1,
    syncPolicy: "append-new-content" as const,
    metadata: params.goal.metadata,
    createdAt,
    updatedAt: createdAt,
  };
}

export function summarizeClassroom(params: {
  classroom: Classroom;
  templates: ClassGoalTemplate[];
  invites: ClassInvite[];
  enrollments: ClassEnrollment[];
}) {
  const activeEnrollments = params.enrollments.filter((item) => item.classroomId === params.classroom.id && item.status === "active");
  const activeInvites = params.invites.filter((item) => item.classroomId === params.classroom.id && item.status === "active");

  return {
    classroomId: params.classroom.id,
    title: params.classroom.title,
    templateCount: params.templates.filter((template) => template.classroomId === params.classroom.id).length,
    activeInviteCount: activeInvites.length,
    enrollmentCount: activeEnrollments.length,
  };
}
