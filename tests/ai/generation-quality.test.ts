import test from "node:test";
import assert from "node:assert/strict";
import { validateGeneratedDays } from "@/lib/ai/generation";
import { GeneratedPlanDay, LearningSource } from "@/lib/types";

function source(subject: LearningSource["subject"]): LearningSource {
  return {
    id: `source-${subject}`,
    type: "text",
    subject,
    title: "Quality test",
    rawText: "Quality test content for generated lessons.",
    userOwnsRights: true,
    childMode: false,
    createdAt: new Date().toISOString(),
  };
}

function validDay(overrides: Partial<GeneratedPlanDay> = {}): GeneratedPlanDay {
  const lessonId = overrides.lessonId ?? "lesson-1";

  return {
    id: "day-1",
    lessonId,
    dayNumber: 1,
    title: "Day 1",
    objective: "Practice one focused skill.",
    vocabulary: ["concept", "practice"],
    chunks: ["Step one", "Step two"],
    dialogue: ["Coach: Try this.", "Learner: I can do it."],
    asset: {
      id: lessonId,
      unitId: "generated-source",
      intro: "Start with one short lesson.",
      coachingNote: "Recall first, then check.",
      personalizationNote: "Generated for this learner.",
      practice: [
        { id: "p1", learningType: "writing", prompt: "Prompt 1", answer: "Answer 1", hint: "Hint 1" },
        { id: "p2", learningType: "grammar", prompt: "Prompt 2", answer: "Answer 2", hint: "Hint 2" },
      ],
      reviewSeeds: [
        { id: "r1", front: "Front 1", back: "Back 1", hint: "Hint 1", tags: ["quality"] },
        { id: "r2", front: "Front 2", back: "Back 2", hint: "Hint 2", tags: ["quality"] },
        { id: "r3", front: "Front 3", back: "Back 3", hint: "Hint 3", tags: ["quality"] },
      ],
    },
    ...overrides,
  };
}

test("generated day quality accepts complete lesson content", () => {
  const result = validateGeneratedDays([validDay()], source("language"), 1);

  assert.equal(result.valid, true);
  assert.deepEqual(result.warnings, []);
});

test("generated day quality rejects incomplete practice and review content", () => {
  const day = validDay({
    asset: {
      ...validDay().asset,
      practice: [{ id: "p1", learningType: "writing", prompt: "", answer: "Answer", hint: "Hint" }],
      reviewSeeds: [{ id: "r1", front: "Front", back: "", hint: "Hint", tags: [] }],
    },
  });
  const result = validateGeneratedDays([day], source("language"), 1);

  assert.equal(result.valid, false);
  assert.ok(result.warnings.some((warning) => warning.includes("practice")));
  assert.ok(result.warnings.some((warning) => warning.includes("review seed")));
});

test("generated day quality rejects subject mismatch for math", () => {
  const day = validDay({
    asset: {
      ...validDay().asset,
      practice: [
        { id: "p1", learningType: "sentence-translation", prompt: "翻成英文：我想練分數。", answer: "I want to practice fractions.", hint: "English" },
        { id: "p2", learningType: "writing", prompt: "Write an English sentence.", answer: "I can solve this.", hint: "English" },
      ],
    },
  });
  const result = validateGeneratedDays([day], source("math"), 1);

  assert.equal(result.valid, false);
  assert.ok(result.warnings.some((warning) => warning.includes("Math generated content")));
});
