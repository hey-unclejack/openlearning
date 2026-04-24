export type ProficiencyLevel = "A1" | "A2" | "B1" | "B2";
export type TargetLanguage = "english";
export type NativeLanguage = "zh-TW";
export type LearningFocus = "travel" | "daily" | "work" | "exam";
export type SubjectArea = "language" | "math" | "chinese";
export type CourseStage = "foundation" | "mobility" | "daily" | "work";
export type LearningType =
  | "sentence-translation"
  | "vocabulary"
  | "listening"
  | "speaking"
  | "writing"
  | "grammar";
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

export interface LearnerProfile {
  targetLanguage: TargetLanguage;
  nativeLanguage: NativeLanguage;
  level: ProficiencyLevel;
  dailyMinutes: number;
  focus: LearningFocus;
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
}

export interface GeneratedLearningPlan {
  id: string;
  sourceId: string;
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
  learningType?: LearningType;
  outcome?: "correct" | "incorrect";
}

export interface AppState {
  onboarded: boolean;
  streak: number;
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
}
