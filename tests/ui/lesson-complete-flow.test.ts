import test from "node:test";
import assert from "node:assert/strict";
import { resolveLessonCompletionRedirect } from "@/lib/lesson-complete-flow";

test("lesson completion redirects to diagnostic when diagnostic lesson id exists", () => {
  const nextPath = resolveLessonCompletionRedirect({
    ok: true,
    diagnosticLessonId: "unit-self-intro-lesson-1",
    completedLessonId: "unit-self-intro-lesson-1",
  });

  assert.equal(nextPath, "/study/diagnostic/unit-self-intro-lesson-1");
});

test("lesson completion redirects back to today with completion context when no diagnostic is needed", () => {
  const nextPath = resolveLessonCompletionRedirect(
    {
      ok: true,
      completedLessonId: "unit-airport-lesson-1",
      completedLessonTitle: "Pass through immigration",
      completedUnitTitle: "Airport Arrival",
      nextLessonId: "unit-airport-lesson-2",
      unitCompleted: true,
    },
    "http://localhost:3000",
  );

  assert.equal(
    nextPath,
    "/study/today?completedLesson=Pass+through+immigration&completedLessonId=unit-airport-lesson-1&completedUnit=Airport+Arrival&nextLessonId=unit-airport-lesson-2&unitCompleted=1",
  );
});
