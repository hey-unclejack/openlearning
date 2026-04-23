export type ProficiencyLevel = "A1" | "A2" | "B1" | "B2";
export type TargetLanguage = "english";
export type NativeLanguage = "zh-TW";
export type LearningFocus = "travel" | "daily" | "work" | "exam";
export type CourseStage = "foundation" | "mobility" | "daily" | "work";

export type ReviewGrade = "again" | "hard" | "good" | "easy";

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

export interface PracticeQuestion {
  id: string;
  prompt: string;
  answer: string;
  hint: string;
  acceptableAnswers?: string[];
}

export interface LessonAsset {
  id: string;
  unitId: string;
  intro: string;
  coachingNote: string;
  practice: PracticeQuestion[];
  reviewSeeds: LessonReviewSeed[];
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
  easeFactor: number;
  intervalDays: number;
  repetitionCount: number;
  lapseCount: number;
  dueDate: string;
  lastReviewedAt?: string;
}

export interface ReviewLog {
  itemId: string;
  grade: ReviewGrade;
  reviewedAt: string;
  nextDueDate: string;
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
}
