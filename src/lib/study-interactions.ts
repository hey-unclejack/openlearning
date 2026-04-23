import { InteractionType, LearningType, ProficiencyLevel } from "@/lib/types";

export const learningTypeInteractionMap: Record<LearningType, InteractionType[]> = {
  "sentence-translation": ["tap-assemble", "type-translation", "speech-translation"],
  vocabulary: ["tap-match", "tap-assemble", "type-translation"],
  listening: ["listen-select", "listen-transcribe", "type-translation"],
  speaking: ["speak-repeat", "speech-translation", "type-translation"],
  writing: ["guided-write", "type-translation", "error-correction"],
  grammar: ["fill-in-blank", "error-correction", "tap-assemble"]
};

export function resolveLearningType(value?: LearningType): LearningType {
  return value ?? "sentence-translation";
}

export function pickInteractionType(params: {
  learningType?: LearningType;
  level?: ProficiencyLevel;
  supportsSpeech: boolean;
  answerTokenCount: number;
}) {
  const learningType = resolveLearningType(params.learningType);
  let candidates = [...learningTypeInteractionMap[learningType]];

  if (learningType === "writing" && (params.level === "A1" || params.level === "A2")) {
    candidates = ["guided-write", "type-translation"];
  }

  if (!params.supportsSpeech) {
    candidates = candidates.filter((mode) => mode !== "speech-translation" && mode !== "speak-repeat");
  }

  if (params.answerTokenCount > 7) {
    candidates = candidates.filter((mode) => mode !== "tap-assemble");
  }

  if (params.level === "A1" || params.level === "A2") {
    candidates = candidates.filter((mode) => mode !== "guided-write");
  }

  if (params.level === "B2" && learningType === "sentence-translation" && params.supportsSpeech) {
    candidates = ["speech-translation", "type-translation", ...candidates];
  }

  const pool = candidates.length ? candidates : ["type-translation"];
  return pool[Math.floor(Math.random() * pool.length)] ?? "type-translation";
}
