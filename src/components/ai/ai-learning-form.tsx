"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useState } from "react";
import { AppLocale } from "@/lib/i18n";
import {
  getLearningGoalSummaryRows,
  learningDomainLabel,
  normalizeLearningDomain,
  subjectDisplayLabel
} from "@/lib/learning-goals";
import {
  AIProviderMode,
  AIUsageLog,
  GeneratedLearningPlan,
  LearningDomain,
  LearningGoal,
  LearningSource,
  LearningSourceType,
  SubjectArea,
  TargetLanguage
} from "@/lib/types";

type PreviewPayload = {
  source: LearningSource;
  plan: GeneratedLearningPlan;
  usageLog: AIUsageLog;
};

type GenerateResponse =
  | ({ ok: true } & PreviewPayload)
  | { ok: false; error: string };

function copy(locale: AppLocale) {
  const isZh = locale === "zh-TW";

  return {
    sourceType: isZh ? "內容來源" : "Source type",
    subject: isZh ? "科目" : "Subject",
    activeGoal: isZh ? "目前學習目標" : "Current learning goal",
    title: isZh ? "主題或標題" : "Topic or title",
    rawText: isZh ? "貼上內容、逐字稿或教材文字" : "Paste content, transcript, or study text",
    url: isZh ? "來源網址" : "Source URL",
    provider: isZh ? "AI 服務" : "AI service",
    rights: isZh ? "我確認有權使用這份內容來建立個人學習材料。" : "I confirm I have the right to use this content for personal learning materials.",
    childMode: isZh ? "家長/兒童模式：不使用個人化廣告，付費與 API 設定由成人管理。" : "Parent/child mode: no personalized ads; billing and API settings stay adult-controlled.",
    generate: isZh ? "產生可編輯預覽" : "Generate editable preview",
    generating: isZh ? "產生中..." : "Generating...",
    preview: isZh ? "確認前預覽" : "Preview before saving",
    previewHelp: isZh
      ? "確認前可修正每日標題、目標、練習題與複習卡；確認後才會進入學習計劃。"
      : "Edit daily titles, objectives, practice, and review cards before the plan enters your learning list.",
    approve: isZh ? "確認並建立計劃" : "Approve and save plan",
    approving: isZh ? "儲存中..." : "Saving...",
    cancel: isZh ? "取消預覽" : "Cancel preview",
    file: isZh ? "上傳文字檔" : "Upload text file",
    fileHint: isZh ? "目前支援 .txt、.md、逐字稿文字；PDF/OCR 可先貼上抽取後內容。" : "Supports .txt, .md, and transcript text for now; paste extracted PDF/OCR text here.",
    recent: isZh ? "最近產生的計劃" : "Recent generated plans",
    open: isZh ? "開始學習" : "Start",
    warnings: isZh ? "品質與成本提示" : "Quality and cost notes",
    byokSettings: isZh ? "AI 設定" : "AI settings",
    billing: isZh
      ? "官方 AI 由平台額度計費；API key / OAuth 會使用你在 AI 設定頁連接的服務。"
      : "Official AI uses platform quota; API key / OAuth uses the service connected in AI settings.",
    noGoal: isZh ? "尚未設定學習目標；目前會以語言學習預設值生成。" : "No learning goal is set yet; language defaults will be used.",
    titlePlaceholder: isZh
      ? "例如：光合作用、國二一次函數、TOEIC Part 5、產品管理章節"
      : "e.g. photosynthesis, linear functions, TOEIC Part 5, product management chapter",
  };
}

const sourceOptions: Array<{ value: LearningSourceType; label: string }> = [
  { value: "topic", label: "Topic" },
  { value: "text", label: "Text" },
  { value: "pdf", label: "PDF text" },
  { value: "image", label: "Image/OCR text" },
  { value: "url", label: "URL text" },
  { value: "youtube", label: "YouTube transcript" },
];

const targetLanguageOptions: Array<{ value: TargetLanguage; label: string }> = [
  { value: "english", label: "English" },
  { value: "japanese", label: "Japanese" },
  { value: "korean", label: "Korean" },
];

const schoolSubjectOptionValues = new Set(["math", "mandarin-literacy", "science", "social-studies"]);

function subjectOptions(locale: AppLocale, activeGoal?: LearningGoal): Array<{ value: SubjectArea; label: string }> {
  const isZh = locale === "zh-TW";
  const options: Array<{ value: SubjectArea; label: string }> = [
    { value: "language", label: isZh ? "語言學習" : "Language" },
    { value: "math", label: isZh ? "學校科目：數學" : "School subject: Math" },
    { value: "mandarin-literacy", label: isZh ? "學校科目：國語 / 國文" : "School subject: Mandarin literacy" },
    { value: "science", label: isZh ? "學校科目：自然 / 科學" : "School subject: Science" },
    { value: "social-studies", label: isZh ? "學校科目：社會 / 歷史地理" : "School subject: Social studies" },
    { value: "exam-cert", label: isZh ? "準備考試 / 證照" : "Exam / certification" },
    { value: "self-study", label: isZh ? "其他自學內容" : "Self-study" },
    { value: "general", label: isZh ? "通用內容" : "General content" },
  ];

  if (
    activeGoal?.domain === "school-subject" &&
    activeGoal.subject &&
    !schoolSubjectOptionValues.has(activeGoal.subject)
  ) {
    options.splice(5, 0, {
      value: activeGoal.subject,
      label: isZh ? `學校科目：${activeGoal.subject}` : `School subject: ${activeGoal.subject}`,
    });
  }

  return options;
}

function initialSubjectForGoal(goal?: LearningGoal): SubjectArea {
  if (!goal) {
    return "language";
  }

  if (goal.domain === "school-subject") {
    return goal.subject || "math";
  }

  if (goal.domain === "language") {
    return "language";
  }

  return goal.domain;
}

function domainForSubjectOption(subject: SubjectArea, activeGoal?: LearningGoal): LearningDomain {
  if (
    subject === "math" ||
    subject === "mandarin-literacy" ||
    subject === "science" ||
    subject === "social-studies" ||
    (activeGoal?.domain === "school-subject" && subject === activeGoal.subject)
  ) {
    return "school-subject";
  }

  return normalizeLearningDomain(subject);
}

export function AiLearningForm({
  locale,
  activeGoal,
  initialPlans,
  usageSummary
}: {
  locale: AppLocale;
  activeGoal?: LearningGoal;
  initialPlans: GeneratedLearningPlan[];
  usageSummary: {
    dailyOfficialLimit: number;
    officialToday: number;
    officialRemaining: number;
    byokToday: number;
    todayCostEstimateUsd: number;
    totalCostEstimateUsd: number;
  };
}) {
  const text = copy(locale);
  const goalRows = getLearningGoalSummaryRows(activeGoal, locale).slice(0, 4);
  const [sourceType, setSourceType] = useState<LearningSourceType>("topic");
  const [subject, setSubject] = useState<SubjectArea>(() => initialSubjectForGoal(activeGoal));
  const [targetLanguage, setTargetLanguage] = useState<TargetLanguage>(activeGoal?.targetLanguage ?? "english");
  const [providerMode, setProviderMode] = useState<AIProviderMode>("official");
  const [title, setTitle] = useState("");
  const [rawText, setRawText] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [userOwnsRights, setUserOwnsRights] = useState(false);
  const [childMode, setChildMode] = useState(false);
  const [plans, setPlans] = useState(initialPlans);
  const [pending, setPending] = useState(false);
  const [approving, setApproving] = useState(false);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewPayload | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const response = await fetch("/api/ai/lessons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceType,
        subject,
        domain: domainForSubjectOption(subject, activeGoal),
        targetLanguage,
        providerMode,
        title,
        rawText: rawText || title,
        sourceUrl,
        userOwnsRights,
        childMode,
        dayCount: 3,
        previewOnly: true,
      }),
    });
    const payload = (await response.json()) as GenerateResponse;
    setPending(false);

    if (!payload.ok) {
      setError(payload.error);
      return;
    }

    setPreview({
      source: payload.source,
      plan: payload.plan,
      usageLog: payload.usageLog,
    });
  }

  function updatePreviewPlan(updater: (plan: GeneratedLearningPlan) => GeneratedLearningPlan) {
    setPreview((current) => current ? { ...current, plan: updater(current.plan) } : current);
  }

  function updatePreviewDay(dayIndex: number, updater: (day: GeneratedLearningPlan["days"][number]) => GeneratedLearningPlan["days"][number]) {
    updatePreviewPlan((plan) => ({
      ...plan,
      days: plan.days.map((day, index) => index === dayIndex ? updater(day) : day),
    }));
  }

  async function approvePreview() {
    if (!preview) {
      return;
    }

    setApproving(true);
    setError(null);

    const response = await fetch("/api/ai/lessons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "commit",
        source: preview.source,
        plan: preview.plan,
        usageLog: preview.usageLog,
      }),
    });
    const payload = (await response.json()) as GenerateResponse;
    setApproving(false);

    if (!payload.ok) {
      setError(payload.error);
      return;
    }

    setPlans((current) => [payload.plan, ...current.filter((plan) => plan.id !== payload.plan.id && plan.status === "active")]);
    setPreview(null);
  }

  async function cancelPreview() {
    if (!preview) {
      return;
    }

    const planId = preview.plan.id;
    setPreview(null);
    await deletePlan(planId, { silent: true });
  }

  async function deletePlan(planId: string, options: { silent?: boolean } = {}) {
    setDeletingPlanId(planId);
    if (!options.silent) {
      setError(null);
    }

    const response = await fetch(`/api/ai/lessons?planId=${encodeURIComponent(planId)}`, {
      method: "DELETE",
    });
    const payload = (await response.json()) as { ok: boolean; error?: string };
    setDeletingPlanId(null);

    if (!payload.ok) {
      if (!options.silent) {
        setError(payload.error ?? "Failed to delete generated plan.");
      }
      return;
    }

    setPlans((current) => current.filter((plan) => plan.id !== planId));
  }

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("text/") && !file.name.endsWith(".md")) {
      setError(text.fileHint);
      return;
    }

    const content = await file.text();
    setRawText(content.slice(0, 12000));
    if (!title) {
      setTitle(file.name.replace(/\.[^.]+$/, ""));
    }
    setSourceType("text");
  }

  return (
    <div className="stack ai-learning-shell">
      <form className="review-card stack ai-learning-form" onSubmit={onSubmit}>
        <div className="muted-box ai-goal-context">
          <div className="eyebrow">{text.activeGoal}</div>
          {activeGoal ? (
            <>
              <strong>{activeGoal.title}</strong>
              <div className="goal-summary-strip">
                {goalRows.map((row) => (
                  <span className="goal-summary-chip" key={row.label}>
                    <strong>{row.label}</strong>
                    {row.value}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="subtle">{text.noGoal}</p>
          )}
        </div>
        <div className="muted-box ai-usage-box">
          <div className="eyebrow">AI quota</div>
          <p className="subtle">
            Official free quota: {usageSummary.officialToday} / {usageSummary.dailyOfficialLimit} today · BYOK generations: {usageSummary.byokToday} · Estimated cost today: ${usageSummary.todayCostEstimateUsd.toFixed(4)}
          </p>
        </div>

        <div className="ai-form-grid">
          <label className="field">
            {text.sourceType}
            <select value={sourceType} onChange={(event) => setSourceType(event.target.value as LearningSourceType)}>
              {sourceOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="field">
            {text.subject}
            <select value={subject} onChange={(event) => setSubject(event.target.value as SubjectArea)}>
              {subjectOptions(locale, activeGoal).map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          {subject === "language" ? (
            <label className="field">
              {locale === "zh-TW" ? "目標語言" : "Target language"}
              <select value={targetLanguage} onChange={(event) => setTargetLanguage(event.target.value as TargetLanguage)}>
                {targetLanguageOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="field">
            {text.provider}
            <select value={providerMode} onChange={(event) => setProviderMode(event.target.value as AIProviderMode)}>
              <option value="official">Official AI quota</option>
              <option value="byok">BYOK API key</option>
              <option value="oauth">OAuth service</option>
            </select>
          </label>
        </div>

        <label className="field">
          {text.title}
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={text.titlePlaceholder} />
        </label>

        <label className="field">
          {text.rawText}
          <textarea value={rawText} onChange={(event) => setRawText(event.target.value)} rows={8} />
        </label>

        <label className="field">
          {text.file}
          <input accept=".txt,.md,text/plain,text/markdown" onChange={onFileChange} type="file" />
          <span className="subtle">{text.fileHint}</span>
        </label>

        <label className="field">
          {text.url}
          <input value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://..." />
        </label>

        <label className="check-row">
          <input checked={userOwnsRights} onChange={(event) => setUserOwnsRights(event.target.checked)} type="checkbox" />
          <span>{text.rights}</span>
        </label>
        <label className="check-row">
          <input checked={childMode} onChange={(event) => setChildMode(event.target.checked)} type="checkbox" />
          <span>{text.childMode}</span>
        </label>

        <div className="muted-box">
          <p className="subtle">{text.billing}</p>
        </div>

        {error ? <div className="toast-inline error">{error}</div> : null}

        <div className="button-row">
          <button className="button" disabled={pending || !userOwnsRights} type="submit">
            {pending ? text.generating : text.generate}
          </button>
          <Link className="button-secondary" href="/profile/ai-settings">
            {text.byokSettings}
          </Link>
        </div>
      </form>

      <section className="review-card stack">
        {preview ? (
          <div className="ai-preview-panel stack">
            <div>
              <div className="eyebrow">{text.preview}</div>
              <p className="subtle">{text.previewHelp}</p>
            </div>
            <div className="generated-plan-list">
              {preview.plan.days.map((day, dayIndex) => (
                <article className="ai-preview-day stack" key={day.id}>
                  <div className="ai-preview-day-header">
                    <label className="field">
                      Day {day.dayNumber} title
                      <input
                        value={day.title}
                        onChange={(event) => updatePreviewDay(dayIndex, (currentDay) => ({ ...currentDay, title: event.target.value }))}
                      />
                    </label>
                    <label className="field">
                      Objective
                      <input
                        value={day.objective}
                        onChange={(event) => updatePreviewDay(dayIndex, (currentDay) => ({ ...currentDay, objective: event.target.value }))}
                      />
                    </label>
                  </div>
                  <label className="field">
                    Coaching note
                    <textarea
                      rows={3}
                      value={day.asset.coachingNote}
                      onChange={(event) => updatePreviewDay(dayIndex, (currentDay) => ({
                        ...currentDay,
                        asset: { ...currentDay.asset, coachingNote: event.target.value },
                      }))}
                    />
                  </label>
                  <div className="ai-preview-grid">
                    <div className="stack">
                      <div className="eyebrow">Practice</div>
                      {day.asset.practice.slice(0, 3).map((question, questionIndex) => (
                        <div className="ai-preview-edit-card stack" key={question.id}>
                          <label className="field compact">
                            Prompt
                            <textarea
                              rows={2}
                              value={question.prompt}
                              onChange={(event) => updatePreviewDay(dayIndex, (currentDay) => ({
                                ...currentDay,
                                asset: {
                                  ...currentDay.asset,
                                  practice: currentDay.asset.practice.map((item, index) => index === questionIndex ? { ...item, prompt: event.target.value } : item),
                                },
                              }))}
                            />
                          </label>
                          <label className="field compact">
                            Answer
                            <input
                              value={question.answer}
                              onChange={(event) => updatePreviewDay(dayIndex, (currentDay) => ({
                                ...currentDay,
                                asset: {
                                  ...currentDay.asset,
                                  practice: currentDay.asset.practice.map((item, index) => index === questionIndex ? { ...item, answer: event.target.value } : item),
                                },
                              }))}
                            />
                          </label>
                          <label className="field compact">
                            Hint
                            <input
                              value={question.hint}
                              onChange={(event) => updatePreviewDay(dayIndex, (currentDay) => ({
                                ...currentDay,
                                asset: {
                                  ...currentDay.asset,
                                  practice: currentDay.asset.practice.map((item, index) => index === questionIndex ? { ...item, hint: event.target.value } : item),
                                },
                              }))}
                            />
                          </label>
                        </div>
                      ))}
                    </div>
                    <div className="stack">
                      <div className="eyebrow">Review cards</div>
                      {day.asset.reviewSeeds.slice(0, 3).map((seed, seedIndex) => (
                        <div className="ai-preview-edit-card stack" key={seed.id}>
                          <label className="field compact">
                            Front
                            <input
                              value={seed.front}
                              onChange={(event) => updatePreviewDay(dayIndex, (currentDay) => ({
                                ...currentDay,
                                asset: {
                                  ...currentDay.asset,
                                  reviewSeeds: currentDay.asset.reviewSeeds.map((item, index) => index === seedIndex ? { ...item, front: event.target.value } : item),
                                },
                              }))}
                            />
                          </label>
                          <label className="field compact">
                            Back
                            <input
                              value={seed.back}
                              onChange={(event) => updatePreviewDay(dayIndex, (currentDay) => ({
                                ...currentDay,
                                asset: {
                                  ...currentDay.asset,
                                  reviewSeeds: currentDay.asset.reviewSeeds.map((item, index) => index === seedIndex ? { ...item, back: event.target.value } : item),
                                },
                              }))}
                            />
                          </label>
                          <label className="field compact">
                            Hint
                            <input
                              value={seed.hint}
                              onChange={(event) => updatePreviewDay(dayIndex, (currentDay) => ({
                                ...currentDay,
                                asset: {
                                  ...currentDay.asset,
                                  reviewSeeds: currentDay.asset.reviewSeeds.map((item, index) => index === seedIndex ? { ...item, hint: event.target.value } : item),
                                },
                              }))}
                            />
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <div className="button-row">
              <button className="button" disabled={approving} onClick={approvePreview} type="button">
                {approving ? text.approving : text.approve}
              </button>
              <button className="button-secondary" disabled={approving} onClick={cancelPreview} type="button">
                {text.cancel}
              </button>
            </div>
          </div>
        ) : null}

        <div>
          <div className="eyebrow">{text.recent}</div>
        </div>
        <div className="generated-plan-list">
          {plans.length === 0 ? <p className="subtle">No generated plans yet.</p> : null}
          {plans.map((plan) => (
            <article className="generated-plan-item" key={plan.id}>
              <div>
                <h2 className="section-title">{plan.days[0]?.title ?? plan.subject}</h2>
                <p className="subtle">
                  {learningDomainLabel(plan.domain, locale)} · {subjectDisplayLabel(plan.subject, locale)} · {plan.days.length} days · {plan.level} · {plan.providerMode} · ${plan.costEstimateUsd.toFixed(4)}
                </p>
                {plan.qualityWarnings.length > 0 ? (
                  <p className="subtle">{text.warnings}: {plan.qualityWarnings.join(" ")}</p>
                ) : null}
              </div>
              {plan.days[0] ? (
                <div className="button-row">
                  <Link className="button" href={`/study/generated/${plan.id}/${plan.days[0].lessonId}`}>
                    {text.open}
                  </Link>
                  <button
                    className="ghost-button"
                    disabled={deletingPlanId === plan.id}
                    onClick={() => deletePlan(plan.id)}
                    type="button"
                  >
                    {deletingPlanId === plan.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
