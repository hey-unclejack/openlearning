import test from "node:test";
import assert from "node:assert/strict";
import { getSubjectLessonCopy } from "@/components/study/lesson-player";

test("math generated lessons use math-specific practice copy", () => {
  const copy = getSubjectLessonCopy("math", "zh-TW");

  assert.match(copy.vocabularyEyebrow, /概念/);
  assert.match(copy.practicePlanBody, /讀題|列式/);
  assert.doesNotMatch(copy.practicePlanBody, /核心翻譯/);
});

test("chinese generated lessons use reading-comprehension copy", () => {
  const copy = getSubjectLessonCopy("chinese", "zh-TW");

  assert.match(copy.vocabularyEyebrow, /關鍵詞/);
  assert.match(copy.practicePlanBody, /主旨|改寫/);
  assert.doesNotMatch(copy.practicePlanBody, /英文/);
});
