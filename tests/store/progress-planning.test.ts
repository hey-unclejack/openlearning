import test from "node:test";
import assert from "node:assert/strict";
import {
  appendProgressGeneratedLesson,
  completeGeneratedLesson,
  createProgressGeneratedPlan,
  deriveStats,
  jumpToProgressLesson,
  readState,
  reorderProgressGeneratedLessons,
  saveProfile,
  updateProgressGeneratedLesson,
} from "@/lib/store";
import { buildEffectiveCoursePlan, canManageCoursePlan } from "@/lib/progress-planning";

function sessionId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

test("self-directed learners can add generated lessons to progress", async () => {
  const id = sessionId("progress-self");
  const plan = await createProgressGeneratedPlan(id, {
    title: "補強問路句型",
    objective: "練習問路時先說目的地，再問方向。",
    mode: "append",
  });
  const state = await readState(id);
  const effective = buildEffectiveCoursePlan(state);

  assert.equal(canManageCoursePlan(state), true);
  assert.equal(plan.days.length, 1);
  assert.ok(effective.lessons.some((lesson) => lesson.lessonId === plan.days[0].lessonId && lesson.source === "generated"));
});

test("managed teacher goals cannot edit progress plans", async () => {
  const id = sessionId("progress-managed");

  await saveProfile(id, {
    activeGoalId: "goal-managed",
    goals: [
      {
        id: "goal-managed",
        domain: "language",
        title: "Managed English",
        targetLanguage: "english",
        nativeLanguage: "zh-TW",
        level: "A2",
        purpose: "daily",
        dailyMinutes: 15,
        managedByTeacher: true,
      },
    ],
    targetLanguage: "english",
    nativeLanguage: "zh-TW",
    level: "A2",
    dailyMinutes: 15,
    focus: "daily",
  });

  const state = await readState(id);
  assert.equal(canManageCoursePlan(state), false);
  await assert.rejects(
    () => createProgressGeneratedPlan(id, { title: "不可新增", objective: "不可新增" }),
    /FORBIDDEN_PROGRESS_PLAN/,
  );
});

test("completed generated lessons are locked from edits", async () => {
  const id = sessionId("progress-completed");
  const plan = await createProgressGeneratedPlan(id, {
    title: "完成後鎖定",
    objective: "完成後不可修改。",
  });

  await completeGeneratedLesson(id, plan.days[0].lessonId);

  await assert.rejects(
    () =>
      updateProgressGeneratedLesson(id, {
        planId: plan.id,
        lessonId: plan.days[0].lessonId,
        title: "修改",
        objective: "不應成功",
      }),
    /PROGRESS_LESSON_COMPLETED/,
  );
});

test("completed generated plans remain visible in progress", async () => {
  const id = sessionId("progress-completed-visible");
  const plan = await createProgressGeneratedPlan(id, {
    title: "完成後仍可查看",
    objective: "完成後仍要出現在全部課程。",
  });

  await completeGeneratedLesson(id, plan.days[0].lessonId);
  const state = await readState(id);
  const effective = buildEffectiveCoursePlan(state);
  const completedLesson = effective.lessons.find((lesson) => lesson.lessonId === plan.days[0].lessonId);

  assert.equal(completedLesson?.status, "completed");
  assert.equal(completedLesson?.locked, true);
  assert.ok(effective.generatedPlans.some((item) => item.id === plan.id && item.status === "completed"));
});

test("new lessons can be appended to an existing generated plan without unlocking completed days", async () => {
  const id = sessionId("progress-append-existing");
  const plan = await createProgressGeneratedPlan(id, {
    title: "第一堂",
    objective: "先完成第一堂。",
  });

  await completeGeneratedLesson(id, plan.days[0].lessonId);
  const updatedPlan = await appendProgressGeneratedLesson(id, {
    planId: plan.id,
    title: "第二堂",
    objective: "追加未完成課程。",
  });
  const state = await readState(id);
  const effective = buildEffectiveCoursePlan(state);
  const first = effective.lessons.find((lesson) => lesson.lessonId === plan.days[0].lessonId);
  const second = effective.lessons.find((lesson) => lesson.lessonId === updatedPlan.days[1].lessonId);

  assert.equal(updatedPlan.status, "active");
  assert.equal(updatedPlan.days.length, 2);
  assert.equal(first?.status, "completed");
  assert.equal(first?.locked, true);
  assert.equal(second?.status, "current");
  assert.equal(second?.locked, false);
});

test("upcoming generated lessons can be reordered after completed lessons", async () => {
  const id = sessionId("progress-reorder");
  const plan = await createProgressGeneratedPlan(id, {
    title: "第一堂",
    objective: "先完成第一堂。",
  });

  await completeGeneratedLesson(id, plan.days[0].lessonId);
  const withSecond = await appendProgressGeneratedLesson(id, {
    planId: plan.id,
    title: "第二堂",
    objective: "第二堂未完成。",
  });
  const withThird = await appendProgressGeneratedLesson(id, {
    planId: plan.id,
    title: "第三堂",
    objective: "第三堂未完成。",
  });
  const secondId = withSecond.days[1].lessonId;
  const thirdId = withThird.days[2].lessonId;

  const reordered = await reorderProgressGeneratedLessons(id, {
    planId: plan.id,
    lessonIds: [thirdId, secondId],
  });

  assert.equal(reordered.days[0].lessonId, plan.days[0].lessonId);
  assert.equal(reordered.days[0].completedAt !== undefined, true);
  assert.equal(reordered.days[1].lessonId, thirdId);
  assert.equal(reordered.days[2].lessonId, secondId);
});

test("completed generated lessons cannot participate in reorder requests", async () => {
  const id = sessionId("progress-reorder-completed");
  const plan = await createProgressGeneratedPlan(id, {
    title: "第一堂",
    objective: "完成後不可重排。",
  });

  await completeGeneratedLesson(id, plan.days[0].lessonId);
  await appendProgressGeneratedLesson(id, {
    planId: plan.id,
    title: "第二堂",
    objective: "未完成。",
  });

  await assert.rejects(
    () =>
      reorderProgressGeneratedLessons(id, {
        planId: plan.id,
        lessonIds: [plan.days[0].lessonId],
      }),
    /PROGRESS_LESSON_COMPLETED/,
  );
});

test("fixed course completed lessons are marked locked in the effective plan", async () => {
  const id = sessionId("progress-fixed");
  const state = await readState(id);
  const effective = buildEffectiveCoursePlan({
    ...state,
    currentDay: 3,
  });
  const completed = effective.lessons.filter((lesson) => lesson.source === "fixed" && lesson.dayNumber < 3);
  const upcoming = effective.lessons.filter((lesson) => lesson.source === "fixed" && lesson.dayNumber >= 3);

  assert.ok(completed.length > 0);
  assert.ok(completed.every((lesson) => lesson.locked && !lesson.canReplan));
  assert.ok(upcoming.length > 0);
  assert.ok(upcoming.every((lesson) => !lesson.locked && lesson.canReplan));
});

test("jumping to a fixed future lesson skips intermediate lessons without counting them complete", async () => {
  const id = sessionId("progress-jump-fixed");
  const before = await readState(id);
  const target = before.plan.find((day) => day.dayNumber === 4);
  assert.ok(target);

  const result = await jumpToProgressLesson(id, { source: "fixed", lessonId: target.lessonId });
  const after = await readState(id);
  const effective = buildEffectiveCoursePlan(after);
  const skipped = effective.lessons.filter((lesson) => lesson.status === "skipped");
  const stats = deriveStats(after);

  assert.equal(result.href, `/study/lesson/${target.lessonId}`);
  assert.equal(after.currentDay, 4);
  assert.deepEqual(skipped.map((lesson) => lesson.dayNumber), [1, 2, 3]);
  assert.equal(stats.completedDays, 0);
});

test("jumping to a generated future lesson marks earlier unfinished generated days as skipped", async () => {
  const id = sessionId("progress-jump-generated");
  const plan = await createProgressGeneratedPlan(id, {
    title: "第一堂",
    objective: "第一堂。",
  });
  const withSecond = await appendProgressGeneratedLesson(id, {
    planId: plan.id,
    title: "第二堂",
    objective: "第二堂。",
  });
  const withThird = await appendProgressGeneratedLesson(id, {
    planId: plan.id,
    title: "第三堂",
    objective: "第三堂。",
  });

  const result = await jumpToProgressLesson(id, {
    source: "generated",
    planId: plan.id,
    lessonId: withThird.days[2].lessonId,
  });
  const after = await readState(id);
  const updatedPlan = after.generatedPlans.find((item) => item.id === plan.id);
  const effective = buildEffectiveCoursePlan(after);

  assert.equal(result.href, `/study/generated/${plan.id}/${withThird.days[2].lessonId}`);
  assert.equal(updatedPlan?.days[0].skippedAt !== undefined, true);
  assert.equal(updatedPlan?.days[1].skippedAt !== undefined, true);
  assert.equal(updatedPlan?.days[2].skippedAt, undefined);
  assert.equal(effective.lessons.find((lesson) => lesson.lessonId === withSecond.days[1].lessonId)?.status, "skipped");
  assert.equal(effective.lessons.find((lesson) => lesson.lessonId === withThird.days[2].lessonId)?.status, "current");
});
