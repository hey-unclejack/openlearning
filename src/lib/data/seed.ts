import { buildCourseState } from "@/lib/data/curriculum";
import { AppState, LearnerProfile } from "@/lib/types";

const defaultProfile: LearnerProfile = {
  targetLanguage: "english",
  nativeLanguage: "zh-TW",
  level: "A2",
  dailyMinutes: 15,
  focus: "travel"
};

export function createInitialState(profile: LearnerProfile = defaultProfile): AppState {
  return buildCourseState({
    onboarded: false,
    streak: 4,
    profile,
    currentDay: 1,
    reviewItems: [],
    reviewLogs: []
  });
}
