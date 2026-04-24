export type ProficiencyLevel = "A1" | "A2" | "B1" | "B2";
export type LearningDomain =
  | "language"
  | "school-subject"
  | "exam-cert"
  | "self-study"
  | "mandarin-literacy"
  | "math"
  | "general";
export type TargetLanguage = "english" | "japanese" | "korean";
export type NativeLanguage = "zh-TW";
export type LearningFocus = "travel" | "daily" | "work" | "exam";
export type LearningPurpose =
  | LearningFocus
  | "reading-writing"
  | "problem-solving"
  | "content-mastery"
  | "school-grade"
  | "score-improvement"
  | "exam-prep"
  | "certification"
  | "project"
  | "knowledge";
export type SubjectArea = LearningDomain | "chinese" | "science" | "social-studies" | (string & {});
export type CourseStage = "foundation" | "mobility" | "daily" | "work";
export type SkillDimension =
  | "translation"
  | "sentence-translation"
  | "vocabulary"
  | "listening"
  | "speaking"
  | "writing"
  | "grammar"
  | "comprehension"
  | "main-idea"
  | "rewrite"
  | "summary"
  | "concept"
  | "procedure"
  | "calculation"
  | "word-problem"
  | "error-analysis"
  | "recall"
  | "application"
  | "explanation";
export type LearningType = SkillDimension;
export type InteractionType =
  | "tap-assemble"
  | "type-translation"
  | "speech-translation"
  | "tap-match"
  | "listen-select"
  | "listen-transcribe"
  | "speak-repeat"
  | "guided-write"
  | "fill-in-blank"
  | "error-correction";

export type ReviewGrade = "again" | "hard" | "good" | "easy";
export type ReviewSessionType = "formal" | "warmup" | "extra" | "diagnostic";
export type ReviewImportance = "core" | "extension";
export type ReviewOutcome = ReviewGrade | "unseen";
export type FsrsCardState = "New" | "Learning" | "Review" | "Relearning";
export type LearningSourceType = "topic" | "text" | "pdf" | "image" | "url" | "youtube";
export type AIProviderMode = "official" | "byok" | "oauth";
export type AIConnectionStatus = "not_configured" | "configured" | "needs_attention";
export type AIConnectionPreference = "platform" | "custom";
export type AICustomConnectionMode = "api" | "oauth";
export type AIApplicationPermission =
  | "generate_courses"
  | "auto_search_courses"
  | "course_optimization"
  | "learning_optimization";
export type GeneratedPlanStatus = "draft" | "active" | "completed" | "failed";
export type LearnerKind = "self" | "supervised-student";
export type SupervisorRole = "parent" | "teacher";
export type AccountMode = "supervisor" | "child";
export type ClassInviteStatus = "active" | "disabled" | "expired";
export type ClassEnrollmentStatus = "active" | "archived";
export type ClassGoalSyncPolicy = "append-new-content";

export interface LearnerProfile {
  activeGoalId?: string;
  goals?: LearningGoal[];
  targetLanguage: TargetLanguage;
  nativeLanguage: NativeLanguage;
  level: ProficiencyLevel;
  dailyMinutes: number;
  focus: LearningFocus;
  desiredRetention?: number;
}

export interface LearningGoal {
  id: string;
  ownerLearnerId?: string;
  domain: LearningDomain;
  title: string;
  targetLanguage?: TargetLanguage;
  nativeLanguage?: NativeLanguage;
  subject?: string;
  level: ProficiencyLevel;
  purpose: LearningPurpose;
  dailyMinutes: number;
  metadata?: Record<string, string | number | boolean>;
  createdAt?: string;
  updatedAt?: string;
  archivedAt?: string;
  templateId?: string;
  classroomId?: string;
  templateVersion?: number;
  managedByTeacher?: boolean;
}

export interface LearnerRestrictions {
  learningOnly: boolean;
  canEditGoals: boolean;
  canUseAiIntake: boolean;
}

export interface LearnerSpace {
  id: string;
  displayName: string;
  kind: LearnerKind;
  supervisorRole?: SupervisorRole;
  profile: LearnerProfile;
  restrictions: LearnerRestrictions;
  archivedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Classroom {
  id: string;
  teacherAccountId: string;
  title: string;
  schoolName?: string;
  gradeBand?: string;
  archivedAt?: string;
  createdAt: string;
}

export interface ClassGoalTemplate {
  id: string;
  classroomId: string;
  sourceGoalId: string;
  title: string;
  domain: LearningDomain;
  subject?: string;
  level: ProficiencyLevel;
  purpose: LearningPurpose;
  dailyMinutes: number;
  templateVersion: number;
  syncPolicy: ClassGoalSyncPolicy;
  metadata?: Record<string, string | number | boolean>;
  createdAt: string;
  updatedAt?: string;
}

export interface ClassInvite {
  id: string;
  classroomId: string;
  templateId: string;
  code: string;
  status: ClassInviteStatus;
  expiresAt?: string;
  createdAt: string;
}

export interface ClassEnrollment {
  id: string;
  classroomId: string;
  templateId: string;
  parentAccountId: string;
  childLearnerId: string;
  assignedGoalId: string;
  status: ClassEnrollmentStatus;
  joinedAt: string;
}

export interface StudyPlanDay {
  id: string;
  lessonId: string;
  unitId: string;
  unitTitle: string;
  unitNumber: number;
  dayNumber: number;
  title: string;
  objective: string;
  vocabulary: string[];
  chunks: string[];
  dialogue: string[];
}

export interface LessonReviewSeed {
  id: string;
  front: string;
  back: string;
  hint: string;
  tags: string[];
}

export interface PracticeQuestionMeta {
  sourceText?: string;
  clozeTarget?: string;
  options?: string[];
  referenceParts?: string[];
  incorrectText?: string;
}

export interface LearningPerformanceStat {
  attempts: number;
  correct: number;
}

export type LearningPerformance = Partial<Record<LearningType, LearningPerformanceStat>>;

export interface PracticeQuestion {
  id: string;
  learningType?: LearningType;
  skillDimension?: SkillDimension;
  prompt: string;
  answer: string;
  hint: string;
  acceptableAnswers?: string[];
  meta?: PracticeQuestionMeta;
}

export interface LessonAsset {
  id: string;
  unitId: string;
  intro: string;
  coachingNote: string;
  personalizationNote: string;
  practice: PracticeQuestion[];
  reviewSeeds: LessonReviewSeed[];
}

export interface LearningSource {
  id: string;
  type: LearningSourceType;
  learnerId?: string;
  goalId?: string;
  domain: LearningDomain;
  subject: SubjectArea;
  title: string;
  rawText: string;
  sourceUrl?: string;
  metadata?: Record<string, string | number | boolean>;
  userOwnsRights: boolean;
  childMode: boolean;
  createdAt: string;
}

export interface GeneratedPlanDay {
  id: string;
  lessonId: string;
  dayNumber: number;
  title: string;
  objective: string;
  vocabulary: string[];
  chunks: string[];
  dialogue: string[];
  asset: LessonAsset;
  completedAt?: string;
  skippedAt?: string;
}

export interface GeneratedLearningPlan {
  id: string;
  sourceId: string;
  learnerId?: string;
  goalId?: string;
  domain: LearningDomain;
  subject: SubjectArea;
  providerMode: AIProviderMode;
  model: string;
  level: ProficiencyLevel;
  focus: LearningFocus;
  dailyMinutes: number;
  status: GeneratedPlanStatus;
  days: GeneratedPlanDay[];
  qualityWarnings: string[];
  costEstimateUsd: number;
  createdAt: string;
}

export interface AIProviderConnection {
  id: string;
  provider: "openai" | "google" | "anthropic" | "openrouter" | "other";
  mode: AIProviderMode;
  status: AIConnectionStatus;
  maskedCredential?: string;
  encryptedCredential?: string;
  model?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AISettings {
  enabled: boolean;
  permissions: Record<AIApplicationPermission, boolean>;
  connectionPreference: AIConnectionPreference;
  customConnectionMode: AICustomConnectionMode;
  updatedAt?: string;
}

export interface AIUsageLog {
  id: string;
  provider: string;
  providerMode: AIProviderMode;
  model: string;
  sourceId?: string;
  generatedPlanId?: string;
  promptTokens: number;
  completionTokens: number;
  costEstimateUsd: number;
  officialQuota: boolean;
  createdAt: string;
}

export interface CourseLesson {
  id: string;
  unitId: string;
  goalId?: string;
  domain?: LearningDomain;
  lessonNumber: number;
  dayNumber: number;
  title: string;
  objective: string;
  vocabulary: string[];
  chunks: string[];
  dialogue: string[];
  asset: LessonAsset;
}

export interface CourseUnit {
  id: string;
  unitNumber: number;
  stage: CourseStage;
  title: string;
  summary: string;
  lessons: CourseLesson[];
}

export interface CourseTrack {
  id: string;
  title: string;
  language: TargetLanguage;
  goalId?: string;
  units: CourseUnit[];
}

export interface ReviewItem {
  id: string;
  front: string;
  back: string;
  hint: string;
  tags: string[];
  lessonId: string;
  unitId: string;
  learnerId?: string;
  goalId?: string;
  domain?: LearningDomain;
  skillDimension: SkillDimension;
  learningType: LearningType;
  importance: ReviewImportance;
  easeFactor: number;
  intervalDays: number;
  repetitionCount: number;
  lapseCount: number;
  dueDate: string;
  lastReviewedAt?: string;
  lastOutcome?: ReviewOutcome;
  lastConfidence?: number;
  needsReinforcement?: boolean;
  fsrsState?: FsrsCardState;
  fsrsStability?: number;
  fsrsDifficulty?: number;
  fsrsElapsedDays?: number;
  fsrsScheduledDays?: number;
  fsrsReps?: number;
  fsrsLapses?: number;
  fsrsLastReview?: string;
}

export interface ReviewLog {
  itemId: string;
  grade: ReviewGrade;
  reviewedAt: string;
  nextDueDate: string;
  sessionType: ReviewSessionType;
  confidence?: number;
  responseMs?: number;
  lessonId?: string;
  unitId?: string;
  learnerId?: string;
  goalId?: string;
  domain?: LearningDomain;
  skillDimension?: SkillDimension;
  learningType?: LearningType;
  outcome?: "correct" | "incorrect";
  fsrsRating?: number;
  fsrsStateBefore?: FsrsCardState;
  fsrsStateAfter?: FsrsCardState;
  fsrsStabilityBefore?: number;
  fsrsStabilityAfter?: number;
  fsrsDifficultyBefore?: number;
  fsrsDifficultyAfter?: number;
  scheduledDaysAfter?: number;
}

export interface AppState {
  onboarded: boolean;
  streak: number;
  accountMode?: AccountMode;
  supervisorPinHash?: string;
  activeLearnerId?: string;
  learners?: LearnerSpace[];
  profile?: LearnerProfile;
  currentDay: number;
  courseTrack: CourseTrack;
  plan: StudyPlanDay[];
  lessons: Record<string, LessonAsset>;
  reviewItems: ReviewItem[];
  reviewLogs: ReviewLog[];
  learningSources: LearningSource[];
  generatedPlans: GeneratedLearningPlan[];
  aiSettings: AISettings;
  aiProviderConnections: AIProviderConnection[];
  aiUsageLogs: AIUsageLog[];
  classrooms: Classroom[];
  classGoalTemplates: ClassGoalTemplate[];
  classInvites: ClassInvite[];
  classEnrollments: ClassEnrollment[];
}
