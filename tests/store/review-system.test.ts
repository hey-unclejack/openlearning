import test from "node:test";
import assert from "node:assert/strict";
import { completeLesson, getDiagnosticReviewItems, getTodayReviewPlan, readState, reviewItem } from "@/lib/store";

function buildSessionId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

test("first lesson completion creates next-day review items and routes into diagnostic", async () => {
  const sessionId = buildSessionId("diagnostic");

  const result = await completeLesson(sessionId, "unit-self-intro-lesson-1");
  const state = await readState(sessionId);
  const diagnosticItems = await getDiagnosticReviewItems(sessionId, "unit-self-intro-lesson-1");

  assert.equal(result.diagnosticLessonId, "unit-self-intro-lesson-1");
  assert.equal(result.completedLessonId, "unit-self-intro-lesson-1");
  assert.equal(state.currentDay, 2);
  assert.equal(diagnosticItems.length, 3);
  assert.ok(diagnosticItems.every((item) => item.lessonId === "unit-self-intro-lesson-1"));
  assert.ok(diagnosticItems.every((item) => new Date(item.dueDate).getTime() > Date.now()));
  assert.ok(diagnosticItems.every((item) => item.fsrsState === "New"));
  assert.ok(diagnosticItems.every((item) => item.fsrsStability === 0));
});

test("extra review updates weakness state without mutating formal due date", async () => {
  const sessionId = buildSessionId("extra-review");

  await completeLesson(sessionId, "unit-self-intro-lesson-1");
  const [firstItem] = await getDiagnosticReviewItems(sessionId, "unit-self-intro-lesson-1");
  assert.ok(firstItem);

  const originalDueDate = firstItem.dueDate;

  await reviewItem(sessionId, firstItem.id, "good", { sessionType: "extra", confidence: 0.7 });
  const stateAfterExtra = await readState(sessionId);
  const itemAfterExtra = stateAfterExtra.reviewItems.find((item) => item.id === firstItem.id);
  assert.ok(itemAfterExtra);
  assert.equal(itemAfterExtra.dueDate, originalDueDate);
  assert.equal(itemAfterExtra.lastOutcome, "good");

  await reviewItem(sessionId, firstItem.id, "good", { sessionType: "formal", confidence: 0.8 });
  const stateAfterFormal = await readState(sessionId);
  const itemAfterFormal = stateAfterFormal.reviewItems.find((item) => item.id === firstItem.id);
  assert.ok(itemAfterFormal);
  assert.notEqual(itemAfterFormal.dueDate, originalDueDate);
  assert.ok(new Date(itemAfterFormal.dueDate).getTime() > new Date(originalDueDate).getTime());
  assert.equal(itemAfterFormal.fsrsState, "Review");
  assert.ok((itemAfterFormal.fsrsScheduledDays ?? 0) > 0);
});

test("formal review writes FSRS state and exposes review plan metadata", async () => {
  const sessionId = buildSessionId("fsrs-formal");

  await completeLesson(sessionId, "unit-self-intro-lesson-1");
  const [firstItem] = await getDiagnosticReviewItems(sessionId, "unit-self-intro-lesson-1");
  assert.ok(firstItem);

  const updated = await reviewItem(sessionId, firstItem.id, "easy", { sessionType: "formal", confidence: 0.95 });
  const state = await readState(sessionId);
  const log = state.reviewLogs.find((item) => item.itemId === firstItem.id);
  const plan = await getTodayReviewPlan(sessionId);

  assert.equal(updated.fsrsState, "Review");
  assert.ok((updated.fsrsStability ?? 0) > 0);
  assert.ok((updated.fsrsDifficulty ?? 0) >= 0);
  assert.equal(log?.fsrsRating, 4);
  assert.equal(log?.fsrsStateBefore, "New");
  assert.equal(log?.fsrsStateAfter, "Review");
  assert.equal(typeof plan.memoryHealth, "number");
  assert.equal(typeof plan.estimatedMinutes, "number");
  assert.ok(["review", "lesson", "reinforce"].includes(plan.nextBestAction));
});
