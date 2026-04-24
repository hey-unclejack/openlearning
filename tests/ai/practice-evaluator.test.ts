import test from "node:test";
import assert from "node:assert/strict";
import { evaluatePracticeAnswer } from "@/lib/content";
import { PracticeQuestion } from "@/lib/types";

test("practice evaluator accepts numeric equivalents for math answers", () => {
  const result = evaluatePracticeAnswer("0.6", "3/5", [], {
    id: "math-1",
    learningType: "grammar",
    prompt: "計算 1/5 + 2/5",
    answer: "3/5",
    hint: "同分母分數相加"
  });

  assert.equal(result.isCorrect, true);
  assert.match(result.feedback, /數值正確/);
});

test("practice evaluator accepts conceptual overlap for Mandarin reading answers", () => {
  const question: PracticeQuestion = {
    id: "chinese-1",
    learningType: "writing",
    prompt: "用一句完整的話寫出這段文字的主旨。",
    answer: "孩子們在春天的公園觀察自然並玩耍。",
    hint: "主旨"
  };
  const result = evaluatePracticeAnswer("春天公園裡孩子玩耍，也觀察自然。", question.answer, [], question);

  assert.equal(result.isCorrect, true);
  assert.match(result.feedback, /方向正確/);
});

test("practice evaluator gives partial feedback for incomplete conceptual answers", () => {
  const question: PracticeQuestion = {
    id: "math-concept",
    learningType: "writing",
    prompt: "用一句話寫出你的解題策略。",
    answer: "我會先列出已知條件，再寫算式並檢查答案。",
    hint: "已知條件 -> 算式 -> 檢查"
  };
  const result = evaluatePracticeAnswer("先找條件", question.answer, [], question);

  assert.equal(result.isCorrect, false);
  assert.match(result.feedback, /一部分重點|參考答案/);
});
