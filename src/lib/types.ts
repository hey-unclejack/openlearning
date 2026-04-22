export type ProficiencyLevel = "A1" | "A2" | "B1" | "B2";

export type ReviewGrade = "again" | "hard" | "good" | "easy";

export interface LearnerProfile {
  targetLanguage: string;
  nativeLanguage: string;
  level: ProficiencyLevel;
  dailyMinutes: number;
  focus: string;
}

export interface StudyPlanDay {
  id: string;
  dayNumber: number;
  title: string;
  objective: string;
  vocabulary: string[];
  chunks: string[];
  dialogue: string[];
}

export interface PracticeQuestion {
  id: string;
  prompt: string;
  answer: string;
  hint: string;
  acceptableAnswers?: string[];
}

export interface Lesson {
  id: string;
  dayId: string;
  intro: string;
  coachingNote: string;
  practice: PracticeQuestion[];
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
  plan: StudyPlanDay[];
  lessons: Record<string, Lesson>;
  reviewItems: ReviewItem[];
  reviewLogs: ReviewLog[];
}
