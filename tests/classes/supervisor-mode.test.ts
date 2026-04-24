import test from "node:test";
import assert from "node:assert/strict";
import {
  createSupervisedLearner,
  readState,
  saveProfile,
  setAccountMode,
  setSupervisorPin,
  switchActiveLearner,
  verifySupervisorPin,
} from "@/lib/store";

test("supervisor PIN gates child mode return without blocking adult child management", async () => {
  const sessionId = `supervisor-${Date.now()}`;

  await saveProfile(sessionId, {
    activeGoalId: "goal-english",
    goals: [
      {
        id: "goal-english",
        domain: "language",
        title: "English daily practice",
        targetLanguage: "english",
        nativeLanguage: "zh-TW",
        level: "A2",
        purpose: "daily",
        dailyMinutes: 15,
      },
    ],
    targetLanguage: "english",
    nativeLanguage: "zh-TW",
    level: "A2",
    dailyMinutes: 15,
    focus: "daily",
  });

  const child = await createSupervisedLearner(sessionId, { displayName: "小安" });
  await setSupervisorPin(sessionId, "1234");

  assert.equal(await verifySupervisorPin(sessionId, "0000"), false);
  assert.equal(await verifySupervisorPin(sessionId, "1234"), true);

  await switchActiveLearner(sessionId, child.id);
  let state = await readState(sessionId);
  assert.equal(state.activeLearnerId, child.id);
  assert.equal(state.accountMode, "supervisor");

  const childMode = await setAccountMode(sessionId, { mode: "child", learnerId: child.id });
  assert.equal(childMode?.mode, "child");
  state = await readState(sessionId);
  assert.equal(state.accountMode, "child");
  assert.equal(state.activeLearnerId, child.id);

  const supervisorMode = await setAccountMode(sessionId, { mode: "supervisor" });
  assert.equal(supervisorMode?.mode, "supervisor");
  state = await readState(sessionId);
  assert.equal(state.accountMode, "supervisor");
  assert.equal(state.activeLearnerId, child.id);
});
