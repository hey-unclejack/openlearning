import { AIApplicationPermission, AISettings } from "@/lib/types";

export const AI_APPLICATION_PERMISSIONS: AIApplicationPermission[] = [
  "generate_courses",
  "auto_search_courses",
  "course_optimization",
  "learning_optimization",
];

export const DEFAULT_AI_SETTINGS: AISettings = {
  enabled: false,
  permissions: {
    generate_courses: false,
    auto_search_courses: false,
    course_optimization: false,
    learning_optimization: false,
  },
  connectionPreference: "platform",
  customConnectionMode: "api",
};

export function normalizeAiSettings(settings?: Partial<AISettings> | null): AISettings {
  return {
    ...DEFAULT_AI_SETTINGS,
    ...settings,
    permissions: {
      ...DEFAULT_AI_SETTINGS.permissions,
      ...settings?.permissions,
    },
  };
}
