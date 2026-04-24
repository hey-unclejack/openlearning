import test from "node:test";
import assert from "node:assert/strict";
import {
  acceptClassInvite,
  createClassGoalTemplate,
  createClassInvite,
  createClassroom,
  getClassSummary,
  readState,
  saveProfile,
  saveGeneratedLearningPlan,
  syncClassTemplate,
} from "@/lib/store";
import { GeneratedLearningPlan, LearningSource } from "@/lib/types";

function makeClassPlan(goalId: string, index: number): { source: LearningSource; plan: GeneratedLearningPlan } {
  const createdAt = new Date(Date.now() + index).toISOString();
  const source: LearningSource = {
    id: `source-${goalId}-${index}`,
    type: "text",
    learnerId: "self",
    goalId,
    domain: "school-subject",
    subject: "mandarin-literacy",
    title: `閱讀教材 ${index}`,
    rawText: `這是第 ${index} 份老師教材。`,
    userOwnsRights: true,
    childMode: true,
    createdAt,
  };
  const plan: GeneratedLearningPlan = {
    id: `plan-${goalId}-${index}`,
    sourceId: source.id,
    learnerId: "self",
    goalId,
    domain: "school-subject",
    subject: "mandarin-literacy",
    providerMode: "official",
    model: "test-model",
    level: "A2",
    focus: "daily",
    dailyMinutes: 15,
    status: "active",
    days: [
      {
        id: `day-${goalId}-${index}`,
        lessonId: `lesson-${goalId}-${index}`,
        dayNumber: 1,
        title: `短課 ${index}`,
        objective: "理解文章主旨",
        vocabulary: ["主旨"],
        chunks: ["找出文章最重要的意思"],
        dialogue: ["老師：這篇文章在說什麼？", "學生：它在說主旨。"],
        asset: {
          id: `asset-${goalId}-${index}`,
          unitId: `unit-${goalId}`,
          intro: "閱讀文章並回答問題。",
          coachingNote: "先找關鍵句。",
          personalizationNote: "依照孩子進度練習。",
          practice: [
            {
              id: `practice-${goalId}-${index}`,
              skillDimension: "main-idea",
              learningType: "main-idea",
              prompt: "這段文字的主旨是什麼？",
              answer: "找出文章最重要的意思",
              hint: "想想作者最想表達的內容。",
            },
          ],
          reviewSeeds: [
            {
              id: `seed-${goalId}-${index}`,
              front: "主旨是什麼？",
              back: "文章最重要的意思。",
              hint: "找關鍵句。",
              tags: ["mandarin-literacy"],
            },
          ],
        },
      },
    ],
    qualityWarnings: [],
    costEstimateUsd: 0,
    createdAt,
  };

  return { source, plan };
}

test("teacher class invite creates isolated teacher-managed child goal", async () => {
  const teacherSessionId = `teacher-${Date.now()}`;
  const parentSessionId = `parent-${Date.now()}`;

  await saveProfile(teacherSessionId, {
    activeGoalId: "goal-grade3-reading",
    goals: [
      {
        id: "goal-grade3-reading",
        domain: "school-subject",
        title: "三年級國語閱讀",
        subject: "mandarin-literacy",
        level: "A2",
        purpose: "reading-writing",
        dailyMinutes: 15,
        metadata: { gradeBand: "elementary" },
      },
    ],
    targetLanguage: "english",
    nativeLanguage: "zh-TW",
    level: "A2",
    dailyMinutes: 15,
    focus: "daily",
  });

  const classroom = await createClassroom(teacherSessionId, {
    title: "三年甲班",
    gradeBand: "elementary",
  });
  const template = await createClassGoalTemplate(teacherSessionId, classroom.id, {});
  assert.ok(template);
  const invite = await createClassInvite(teacherSessionId, classroom.id, template.id);
  assert.ok(invite);

  const accepted = await acceptClassInvite(parentSessionId, invite.code, { childName: "小安" });
  assert.ok(accepted);
  assert.equal(accepted.goal.managedByTeacher, true);
  assert.equal(accepted.goal.templateId, template.id);
  assert.equal(accepted.goal.classroomId, classroom.id);
  assert.equal(accepted.learner.kind, "supervised-student");

  const parentState = await readState(parentSessionId);
  assert.equal(parentState.activeLearnerId, accepted.learner.id);
  assert.equal(parentState.profile?.activeGoalId, accepted.goal.id);
  assert.equal(parentState.learners?.find((learner) => learner.id === accepted.learner.id)?.profile.goals?.[0].id, accepted.goal.id);

  const teacherSummary = await getClassSummary(teacherSessionId, classroom.id);
  assert.equal(teacherSummary?.joinedCount, 1);
  assert.equal(teacherSummary?.enrollments[0].childLearnerId, accepted.learner.id);
});

test("class template sync appends teacher content to enrolled child goals", async () => {
  const teacherSessionId = `teacher-sync-${Date.now()}`;
  const parentSessionId = `parent-sync-${Date.now()}`;
  const sourceGoalId = "goal-grade3-sync-reading";

  await saveProfile(teacherSessionId, {
    activeGoalId: sourceGoalId,
    goals: [
      {
        id: sourceGoalId,
        domain: "school-subject",
        title: "三年級國語同步閱讀",
        subject: "mandarin-literacy",
        level: "A2",
        purpose: "reading-writing",
        dailyMinutes: 15,
        metadata: { gradeBand: "elementary" },
      },
    ],
    targetLanguage: "english",
    nativeLanguage: "zh-TW",
    level: "A2",
    dailyMinutes: 15,
    focus: "daily",
  });

  const classroom = await createClassroom(teacherSessionId, { title: "三年乙班" });
  const template = await createClassGoalTemplate(teacherSessionId, classroom.id, {});
  assert.ok(template);
  const first = makeClassPlan(sourceGoalId, 1);
  await saveGeneratedLearningPlan(teacherSessionId, {
    source: first.source,
    plan: first.plan,
    usageLog: {
      id: "usage-sync-1",
      provider: "openai",
      providerMode: "official",
      model: "test-model",
      sourceId: first.source.id,
      generatedPlanId: first.plan.id,
      promptTokens: 1,
      completionTokens: 1,
      costEstimateUsd: 0,
      officialQuota: true,
      createdAt: first.plan.createdAt,
    },
  });
  const invite = await createClassInvite(teacherSessionId, classroom.id, template.id);
  assert.ok(invite);
  const accepted = await acceptClassInvite(parentSessionId, invite.code, { childName: "小恩" });
  assert.ok(accepted);

  let parentState = await readState(parentSessionId);
  assert.equal(parentState.generatedPlans.filter((plan) => plan.goalId === accepted.goal.id).length, 1);

  const second = makeClassPlan(sourceGoalId, 2);
  await saveGeneratedLearningPlan(teacherSessionId, {
    source: second.source,
    plan: second.plan,
    usageLog: {
      id: "usage-sync-2",
      provider: "openai",
      providerMode: "official",
      model: "test-model",
      sourceId: second.source.id,
      generatedPlanId: second.plan.id,
      promptTokens: 1,
      completionTokens: 1,
      costEstimateUsd: 0,
      officialQuota: true,
      createdAt: second.plan.createdAt,
    },
  });

  const syncResult = await syncClassTemplate(teacherSessionId, classroom.id, template.id);
  assert.equal(syncResult?.syncedChildGoalCount, 1);
  parentState = await readState(parentSessionId);
  const child = parentState.learners?.find((learner) => learner.id === accepted.learner.id);
  const assignedGoal = child?.profile.goals?.find((goal) => goal.id === accepted.goal.id);

  assert.equal(assignedGoal?.templateVersion, 2);
  assert.equal(parentState.generatedPlans.filter((plan) => plan.goalId === accepted.goal.id).length, 2);
  assert.equal(parentState.generatedPlans.some((plan) => plan.id === `${second.plan.id}-copy-${accepted.learner.id}`), true);
});
