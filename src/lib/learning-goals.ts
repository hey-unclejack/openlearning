import {
  GeneratedLearningPlan,
  LearningDomain,
  LearningGoal,
  LearningPurpose,
  LearnerProfile,
  SkillDimension,
  SubjectArea,
  TargetLanguage,
} from "@/lib/types";

export const languageTargetLabels: Record<TargetLanguage, string> = {
  english: "English",
  japanese: "Japanese",
  korean: "Korean",
};

export const domainSkillDimensions: Record<LearningDomain, SkillDimension[]> = {
  language: ["translation", "vocabulary", "listening", "speaking", "writing", "grammar"],
  "school-subject": ["concept", "procedure", "calculation", "comprehension", "summary", "application"],
  "exam-cert": ["recall", "concept", "application", "error-analysis", "summary"],
  "self-study": ["recall", "concept", "application", "summary", "explanation"],
  "mandarin-literacy": ["comprehension", "main-idea", "vocabulary", "rewrite", "summary"],
  math: ["concept", "procedure", "calculation", "word-problem", "error-analysis"],
  general: ["recall", "concept", "application", "summary", "explanation"],
};

const knownLearningDomains: LearningDomain[] = [
  "language",
  "school-subject",
  "exam-cert",
  "self-study",
  "mandarin-literacy",
  "math",
  "general",
];

export function normalizeLearningDomain(subject?: SubjectArea | string | null): LearningDomain {
  if (subject === "chinese") {
    return "mandarin-literacy";
  }

  if (subject === "science" || subject === "social-studies") {
    return "school-subject";
  }

  if (knownLearningDomains.includes(subject as LearningDomain)) {
    return subject as LearningDomain;
  }

  return "general";
}

export function canonicalSubjectForDomain(domain: LearningDomain): SubjectArea {
  return domain;
}

export function learningGoalTitle(params: {
  domain: LearningDomain;
  targetLanguage?: TargetLanguage;
  subject?: string;
}) {
  if (params.domain === "language") {
    return `${languageTargetLabels[params.targetLanguage ?? "english"]} learning`;
  }

  if (params.domain === "mandarin-literacy") {
    return "Mandarin literacy";
  }

  if (params.domain === "math") {
    return params.subject?.trim() ? `Math: ${params.subject.trim()}` : "Math problem solving";
  }

  if (params.domain === "school-subject") {
    return params.subject?.trim() ? `School subject: ${params.subject.trim()}` : "School subject learning";
  }

  if (params.domain === "exam-cert") {
    return params.subject?.trim() ? `Exam prep: ${params.subject.trim()}` : "Exam and certification prep";
  }

  if (params.domain === "self-study") {
    return params.subject?.trim() ? params.subject.trim() : "Self-study project";
  }

  return params.subject?.trim() ? params.subject.trim() : "Personal content learning";
}

export function defaultPurposeForDomain(domain: LearningDomain): LearningPurpose {
  const purposes: Record<LearningDomain, LearningPurpose> = {
    language: "travel",
    "school-subject": "school-grade",
    "exam-cert": "exam-prep",
    "self-study": "knowledge",
    "mandarin-literacy": "reading-writing",
    math: "problem-solving",
    general: "content-mastery",
  };

  return purposes[domain];
}

export function learningDomainLabel(domain: LearningDomain, locale: string) {
  const isZh = locale === "zh-TW";
  const labels: Record<LearningDomain, string> = {
    language: isZh ? "語言學習" : "Language",
    "school-subject": isZh ? "學校科目" : "School subject",
    "exam-cert": isZh ? "考試 / 證照" : "Exam / certification",
    "self-study": isZh ? "其他自學" : "Self-study",
    "mandarin-literacy": isZh ? "國語 / 國文" : "Mandarin literacy",
    math: isZh ? "數學" : "Math",
    general: isZh ? "通用內容" : "General content",
  };

  return labels[domain];
}

export function learningPurposeLabel(purpose: LearningPurpose, locale: string) {
  const isZh = locale === "zh-TW";
  const labels: Record<LearningPurpose, string> = {
    travel: isZh ? "旅行或生活情境" : "Travel or everyday situations",
    daily: isZh ? "日常聽說讀寫" : "Daily practice",
    work: isZh ? "工作或專業使用" : "Work or professional use",
    exam: isZh ? "語言考試" : "Language exam",
    "reading-writing": isZh ? "加強閱讀寫作" : "Reading and writing",
    "problem-solving": isZh ? "加強解題" : "Problem solving",
    "content-mastery": isZh ? "掌握一份內容" : "Content mastery",
    "school-grade": isZh ? "跟上學校進度" : "Keep up with class",
    "score-improvement": isZh ? "提高成績" : "Improve grades",
    "exam-prep": isZh ? "準備考試" : "Exam prep",
    certification: isZh ? "準備證照" : "Certification prep",
    project: isZh ? "完成作品或專案" : "Finish a project",
    knowledge: isZh ? "理解並記住知識" : "Understand and remember",
  };

  return labels[purpose];
}

export function subjectDisplayLabel(subject: string | undefined, locale: string) {
  const isZh = locale === "zh-TW";

  if (!subject) {
    return isZh ? "未設定" : "Not set";
  }

  const labels: Record<string, string> = {
    language: isZh ? "語言" : "Language",
    math: isZh ? "數學" : "Math",
    chinese: isZh ? "國語 / 國文" : "Mandarin / Chinese literacy",
    "mandarin-literacy": isZh ? "國語 / 國文" : "Mandarin / Chinese literacy",
    science: isZh ? "自然 / 科學" : "Science",
    "social-studies": isZh ? "社會 / 歷史地理" : "Social studies",
    "school-subject": isZh ? "學校科目" : "School subject",
    "exam-cert": isZh ? "考試 / 證照" : "Exam / certification",
    "self-study": isZh ? "自學內容" : "Self-study",
    general: isZh ? "通用內容" : "General content",
  };

  return labels[subject] ?? subject;
}

export function gradeBandLabel(value: string | undefined, locale: string) {
  const isZh = locale === "zh-TW";

  if (!value) {
    return "";
  }

  const labels: Record<string, string> = {
    elementary: isZh ? "國小" : "Elementary school",
    "junior-high": isZh ? "國中" : "Junior high",
    "senior-high": isZh ? "高中" : "Senior high",
    college: isZh ? "大學 / 專科" : "College / vocational",
    "other-coursework": isZh ? "其他課程" : "Other coursework",
  };

  return labels[value] ?? value;
}

function metadataText(goal: LearningGoal, key: string) {
  const value = goal.metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

export function getLearningGoalSummaryRows(goal: LearningGoal | undefined, locale: string) {
  const isZh = locale === "zh-TW";

  if (!goal) {
    return [];
  }

  const rows = [
    {
      label: isZh ? "類別" : "Type",
      value: learningDomainLabel(goal.domain, locale),
    },
  ];

  if (goal.domain === "language") {
    rows.push({
      label: isZh ? "目標語言" : "Target language",
      value: languageTargetLabels[goal.targetLanguage ?? "english"],
    });
  } else if (goal.domain === "school-subject") {
    rows.push({
      label: isZh ? "學歷 / 學制" : "Education level",
      value: gradeBandLabel(metadataText(goal, "gradeBand"), locale) || (isZh ? "未設定" : "Not set"),
    });
    rows.push({
      label: isZh ? "科目" : "Subject",
      value: subjectDisplayLabel(goal.subject, locale),
    });
  } else if (goal.domain === "exam-cert") {
    rows.push({
      label: isZh ? "考試 / 證照" : "Exam / certification",
      value: subjectDisplayLabel(goal.subject, locale),
    });
    const targetScore = metadataText(goal, "targetScore");
    const examDate = metadataText(goal, "examDate");
    if (targetScore || examDate) {
      rows.push({
        label: isZh ? "目標" : "Target",
        value: [targetScore, examDate].filter(Boolean).join(" · "),
      });
    }
  } else if (goal.domain === "self-study") {
    rows.push({
      label: isZh ? "主題" : "Topic",
      value: subjectDisplayLabel(goal.subject, locale),
    });
    const outcome = metadataText(goal, "outcome");
    if (outcome) {
      rows.push({
        label: isZh ? "成果" : "Outcome",
        value: outcome,
      });
    }
  } else {
    rows.push({
      label: isZh ? "內容" : "Content",
      value: subjectDisplayLabel(goal.subject, locale),
    });
  }

  rows.push({
    label: isZh ? "目的" : "Purpose",
    value: learningPurposeLabel(goal.purpose, locale),
  });
  rows.push({
    label: isZh ? "每日節奏" : "Daily rhythm",
    value: isZh ? `${goal.dailyMinutes} 分鐘` : `${goal.dailyMinutes} minutes`,
  });

  return rows;
}

export function makeDefaultLearningGoal(profile: Pick<LearnerProfile, "targetLanguage" | "nativeLanguage" | "level" | "dailyMinutes" | "focus">): LearningGoal {
  return {
    id: "goal-english-core",
    domain: "language",
    title: learningGoalTitle({ domain: "language", targetLanguage: profile.targetLanguage }),
    targetLanguage: profile.targetLanguage,
    nativeLanguage: profile.nativeLanguage,
    level: profile.level,
    purpose: profile.focus,
    dailyMinutes: profile.dailyMinutes,
  };
}

export function normalizeLearnerProfile(profile: LearnerProfile): LearnerProfile {
  const goals = profile.goals && profile.goals.length > 0 ? profile.goals : [makeDefaultLearningGoal(profile)];
  const activeGoalId = profile.activeGoalId ?? goals[0]?.id;

  return {
    ...profile,
    activeGoalId,
    goals,
    desiredRetention: profile.desiredRetention ?? 0.9,
  };
}

export function getActiveLearningGoal(profile: LearnerProfile): LearningGoal {
  const normalized = normalizeLearnerProfile(profile);
  return normalized.goals?.find((goal) => goal.id === normalized.activeGoalId) ?? normalized.goals![0];
}

export function hasFixedCourseTrack(goal?: LearningGoal) {
  return goal?.domain === "language" && (goal.targetLanguage ?? "english") === "english";
}

export function getActiveGoalPlans(plans: GeneratedLearningPlan[], goal?: LearningGoal) {
  return plans.filter((plan) => {
    if (goal?.id && plan.goalId) {
      return plan.goalId === goal.id;
    }

    return plan.domain === (goal?.domain ?? "language");
  });
}

export function getNextGeneratedPlanDay(plans: GeneratedLearningPlan[], goal?: LearningGoal) {
  const activePlan = getActiveGoalPlans(plans, goal)
    .filter((plan) => plan.status === "active")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const day = activePlan?.days.find((candidate) => !candidate.completedAt && !candidate.skippedAt) ?? activePlan?.days[0];

  return activePlan && day ? { plan: activePlan, day } : null;
}

export function getSkillDimensionsForDomain(domain?: LearningDomain): SkillDimension[] {
  return domainSkillDimensions[domain ?? "language"];
}

export function defaultSkillDimensionForDomain(domain?: LearningDomain): SkillDimension {
  return getSkillDimensionsForDomain(domain)[0] ?? "translation";
}

export function normalizeSkillDimension(value?: SkillDimension | string | null, domain?: LearningDomain): SkillDimension {
  if (value === "sentence-translation") {
    return "translation";
  }

  const all = new Set(Object.values(domainSkillDimensions).flat());
  if (value && all.has(value as SkillDimension)) {
    return value as SkillDimension;
  }

  return defaultSkillDimensionForDomain(domain);
}

export function legacyLearningTypeForSkill(skill: SkillDimension): SkillDimension {
  return skill === "translation" ? "sentence-translation" : skill;
}
