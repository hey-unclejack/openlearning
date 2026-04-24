import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { encryptCredential, maskCredential } from "@/lib/ai/credentials";
import { generateLearningPlan } from "@/lib/ai/generation";
import {
  completeLesson,
  deleteAiProviderConnection,
  deleteGeneratedLearningPlan,
  getAiBusinessSnapshot,
  getAiProviderConnection,
  getDiagnosticReviewItems,
  getGeneratedLessonContext,
  readState,
  saveAiProviderConnection,
  saveProfile
} from "@/lib/store";

test("generates a three day plan from user-owned text content", async () => {
  const sessionId = `ai-generation-${Date.now()}`;

  await saveProfile(sessionId, {
    targetLanguage: "english",
    nativeLanguage: "zh-TW",
    level: "A2",
    dailyMinutes: 15,
    focus: "work",
  });

  const result = await generateLearningPlan({
    sessionId,
    sourceType: "text",
    subject: "language",
    title: "Customer support reply",
    rawText: "The customer needs a clear reply about the delayed shipment. We should apologize, explain the next step, and confirm the follow-up time.",
    userOwnsRights: true,
    providerMode: "official",
    dayCount: 3,
  });

  assert.equal(result.ok, true);

  if (!result.ok) {
    return;
  }

  assert.equal(result.plan.days.length, 3);
  assert.equal(result.plan.subject, "language");
  assert.ok(result.plan.days[0].asset.practice.length > 0);
  assert.ok(result.plan.days[0].asset.reviewSeeds.length > 0);
  assert.ok(result.usageLog.costEstimateUsd >= 0);

  const state = await readState(sessionId);
  assert.equal(state.generatedPlans[0].id, result.plan.id);
  assert.equal(state.learningSources[0].id, result.source.id);
});

test("preview generation stores a draft plan before user approval", async () => {
  const sessionId = `ai-generation-preview-${Date.now()}`;

  const result = await generateLearningPlan({
    sessionId,
    sourceType: "topic",
    subject: "language",
    title: "preview approval flow",
    rawText: "preview approval flow",
    userOwnsRights: true,
    providerMode: "official",
    dayCount: 3,
    planStatus: "draft",
  });

  assert.equal(result.ok, true);

  if (!result.ok) {
    return;
  }

  assert.equal(result.plan.status, "draft");

  const state = await readState(sessionId);
  assert.equal(state.generatedPlans[0].id, result.plan.id);
  assert.equal(state.generatedPlans[0].status, "draft");
});

test("math subject generates math-specific practice instead of language translation", async () => {
  const result = await generateLearningPlan({
    sessionId: `ai-generation-math-${Date.now()}`,
    sourceType: "text",
    subject: "math",
    title: "分數加法",
    rawText: "小學生要練習同分母分數加法，例如 1/5 + 2/5，要先看分母是否相同，再把分子相加。",
    userOwnsRights: true,
    providerMode: "official",
    childMode: true,
    dayCount: 3,
  });

  assert.equal(result.ok, true);

  if (!result.ok) {
    return;
  }

  const firstDay = result.plan.days[0];
  assert.equal(result.plan.subject, "math");
  assert.match(firstDay.asset.intro, /數學/);
  assert.match(firstDay.asset.practice[0].prompt, /已知條件|解題|題目/);
  assert.doesNotMatch(firstDay.asset.practice[0].prompt, /翻成英文/);
  assert.ok(firstDay.asset.reviewSeeds.every((seed) => seed.tags.includes("math")));
});

test("chinese subject generates reading-comprehension practice", async () => {
  const result = await generateLearningPlan({
    sessionId: `ai-generation-chinese-${Date.now()}`,
    sourceType: "text",
    subject: "chinese",
    title: "閱讀理解",
    rawText: "春天到了，公園裡的花慢慢開了。孩子們在草地上玩耍，也觀察蜜蜂如何採花蜜。",
    userOwnsRights: true,
    providerMode: "official",
    childMode: true,
    dayCount: 3,
  });

  assert.equal(result.ok, true);

  if (!result.ok) {
    return;
  }

  const firstDay = result.plan.days[0];
  assert.equal(result.plan.subject, "chinese");
  assert.match(firstDay.asset.intro, /國文|閱讀/);
  assert.match(firstDay.asset.practice[0].prompt, /關鍵詞/);
  assert.match(firstDay.asset.practice[1].prompt, /主旨/);
  assert.ok(firstDay.asset.reviewSeeds.every((seed) => seed.tags.includes("chinese")));
});

test("rejects imported content when the user has not confirmed rights", async () => {
  const result = await generateLearningPlan({
    sessionId: `ai-generation-rights-${Date.now()}`,
    sourceType: "text",
    title: "Unconfirmed",
    rawText: "This content should not be accepted without a rights confirmation.",
    userOwnsRights: false,
  });

  assert.equal(result.ok, false);
});

test("completing a generated lesson creates diagnostic review items and next lesson context", async () => {
  const sessionId = `ai-generation-complete-${Date.now()}`;

  await saveProfile(sessionId, {
    targetLanguage: "english",
    nativeLanguage: "zh-TW",
    level: "A2",
    dailyMinutes: 15,
    focus: "daily",
  });

  const result = await generateLearningPlan({
    sessionId,
    sourceType: "topic",
    subject: "language",
    title: "ordering coffee",
    rawText: "ordering coffee",
    userOwnsRights: true,
    providerMode: "official",
    dayCount: 3,
  });

  assert.equal(result.ok, true);

  if (!result.ok) {
    return;
  }

  const firstLessonId = result.plan.days[0].lessonId;
  const completion = await completeLesson(sessionId, firstLessonId);
  const diagnosticItems = await getDiagnosticReviewItems(sessionId, firstLessonId);
  const generatedContext = await getGeneratedLessonContext(sessionId, firstLessonId);

  assert.equal(completion.diagnosticLessonId, firstLessonId);
  assert.equal(diagnosticItems.length, 3);
  assert.equal(generatedContext?.day.lessonId, firstLessonId);
  assert.equal(generatedContext?.nextDay?.dayNumber, 2);
});

test("official generation is limited by the daily free quota", async () => {
  const sessionId = `ai-generation-quota-${Date.now()}`;

  await saveProfile(sessionId, {
    targetLanguage: "english",
    nativeLanguage: "zh-TW",
    level: "A2",
    dailyMinutes: 15,
    focus: "daily",
  });

  for (const index of [1, 2, 3]) {
    const result = await generateLearningPlan({
      sessionId,
      sourceType: "topic",
      subject: "language",
      title: `quota topic ${index}`,
      rawText: `quota topic ${index}`,
      userOwnsRights: true,
      providerMode: "official",
      dayCount: 3,
    });

    assert.equal(result.ok, true);
  }

  const blocked = await generateLearningPlan({
    sessionId,
    sourceType: "topic",
    subject: "language",
    title: "quota topic 4",
    rawText: "quota topic 4",
    userOwnsRights: true,
    providerMode: "official",
    dayCount: 3,
  });

  assert.equal(blocked.ok, false);
});

test("byok generation requires a configured provider connection", async () => {
  const result = await generateLearningPlan({
    sessionId: `ai-generation-byok-${Date.now()}`,
    sourceType: "topic",
    subject: "language",
    title: "custom api key topic",
    rawText: "custom api key topic",
    userOwnsRights: true,
    providerMode: "byok",
    dayCount: 3,
  });

  assert.equal(result.ok, false);
});

test("byok provider connection can be removed and blocks future byok generation", async () => {
  const sessionId = `ai-generation-provider-delete-${Date.now()}`;
  const now = new Date().toISOString();

  await saveAiProviderConnection(sessionId, {
    id: "test-openai-byok",
    provider: "openai",
    mode: "byok",
    status: "configured",
    maskedCredential: maskCredential("sk-test-provider-delete"),
    encryptedCredential: encryptCredential("sk-test-provider-delete"),
    model: "gpt-4.1-mini",
    createdAt: now,
    updatedAt: now,
  });

  assert.equal((await getAiProviderConnection(sessionId, "openai"))?.status, "configured");
  assert.equal(await deleteAiProviderConnection(sessionId, "openai"), true);
  assert.equal(await getAiProviderConnection(sessionId, "openai"), undefined);

  const result = await generateLearningPlan({
    sessionId,
    sourceType: "topic",
    subject: "language",
    title: "provider delete topic",
    rawText: "provider delete topic",
    userOwnsRights: true,
    providerMode: "byok",
    dayCount: 3,
  });

  assert.equal(result.ok, false);
});

test("generated plans and imported source content can be deleted", async () => {
  const sessionId = `ai-generation-delete-${Date.now()}`;
  const result = await generateLearningPlan({
    sessionId,
    sourceType: "text",
    subject: "language",
    title: "Delete me",
    rawText: "This user-owned content should be removable from the generated plan store.",
    userOwnsRights: true,
    providerMode: "official",
    dayCount: 3,
  });

  assert.equal(result.ok, true);

  if (!result.ok) {
    return;
  }

  assert.equal(await deleteGeneratedLearningPlan(sessionId, result.plan.id), true);

  const state = await readState(sessionId);
  assert.equal(state.generatedPlans.some((plan) => plan.id === result.plan.id), false);
  assert.equal(state.learningSources.some((source) => source.id === result.source.id), false);
});

test("ai business snapshot summarizes cost, completion, sources, and byok state", async () => {
  const sessionId = `ai-business-snapshot-${Date.now()}`;
  const result = await generateLearningPlan({
    sessionId,
    sourceType: "text",
    subject: "language",
    title: "Snapshot source",
    rawText: "This source should create business metrics for usage cost and completion tracking.",
    userOwnsRights: true,
    providerMode: "official",
    childMode: true,
    dayCount: 3,
  });

  assert.equal(result.ok, true);

  if (!result.ok) {
    return;
  }

  await completeLesson(sessionId, result.plan.days[0].lessonId);

  const now = new Date().toISOString();
  await saveAiProviderConnection(sessionId, {
    id: "snapshot-openai-byok",
    provider: "openai",
    mode: "byok",
    status: "configured",
    maskedCredential: maskCredential("sk-snapshot"),
    encryptedCredential: encryptCredential("sk-snapshot"),
    model: "gpt-4.1-mini",
    createdAt: now,
    updatedAt: now,
  });

  const snapshot = await getAiBusinessSnapshot(sessionId);

  assert.equal(snapshot.generatedPlanCount, 1);
  assert.equal(snapshot.activePlanCount, 1);
  assert.equal(snapshot.completedLessonCount, 1);
  assert.equal(snapshot.totalGeneratedLessonCount, 3);
  assert.equal(snapshot.sourceTypeCounts.text, 1);
  assert.equal(snapshot.topSourceType, "text");
  assert.equal(snapshot.officialUsageCount, 1);
  assert.equal(snapshot.byokConfigured, true);
  assert.equal(snapshot.childModeSourceCount, 1);
  assert.ok(snapshot.avgCostPerPlan >= 0);
});

test("url source imports readable html when no body text is provided", async () => {
  const server = createServer((request, response) => {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(`
      <html>
        <head><title>Imported Article Title</title><style>.hidden{display:none}</style></head>
        <body>
          <nav>Skip navigation</nav>
          <main>
            <h1>Useful English Meeting Notes</h1>
            <p>The team needs to confirm the meeting agenda and share a short follow-up email after the discussion.</p>
          </main>
          <script>window.noise = true;</script>
        </body>
      </html>
    `);
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));

  try {
    const address = server.address();
    assert.equal(typeof address, "object");

    if (!address || typeof address !== "object") {
      return;
    }

    const result = await generateLearningPlan({
      sessionId: `ai-generation-url-${Date.now()}`,
      sourceType: "url",
      subject: "language",
      title: "",
      rawText: "",
      sourceUrl: `http://127.0.0.1:${address.port}/article`,
      userOwnsRights: true,
      providerMode: "official",
      dayCount: 3,
    });

    assert.equal(result.ok, true);

    if (!result.ok) {
      return;
    }

    assert.equal(result.source.title, "Imported Article Title");
    assert.equal(result.source.metadata?.urlFetched, true);
    assert.match(result.source.rawText, /Useful English Meeting Notes/);
    assert.doesNotMatch(result.source.rawText, /window\.noise/);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test("source quality gate rejects unsafe learning material", async () => {
  const result = await generateLearningPlan({
    sessionId: `ai-generation-safety-${Date.now()}`,
    sourceType: "text",
    subject: "language",
    title: "Unsafe",
    rawText: "This asks how to make a bomb and should never become learning material.",
    userOwnsRights: true,
    providerMode: "official",
    dayCount: 3,
  });

  assert.equal(result.ok, false);
});

test("long source content is trimmed and reported in quality warnings", async () => {
  const result = await generateLearningPlan({
    sessionId: `ai-generation-long-${Date.now()}`,
    sourceType: "text",
    subject: "language",
    title: "Long source",
    rawText: `${"A useful sentence about workplace communication. ".repeat(400)}End.`,
    userOwnsRights: true,
    providerMode: "official",
    dayCount: 3,
  });

  assert.equal(result.ok, true);

  if (!result.ok) {
    return;
  }

  assert.equal(result.source.rawText.length, 12000);
  assert.ok(result.plan.qualityWarnings.some((warning) => warning.includes("trimmed")));
});
