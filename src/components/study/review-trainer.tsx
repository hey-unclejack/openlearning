"use client";

import Link from "next/link";
import { scoreToLabel } from "@/lib/srs";
import { LearningType, ReviewGrade, ReviewItem, ReviewSessionType } from "@/lib/types";
import { startTransition, useEffect, useState } from "react";
import { AppLocale, getLocaleCopy } from "@/lib/i18n";
import { ReviewPlanningCard } from "@/components/study/review-planning-card";
import { StudySessionShell } from "@/components/study/study-session-shell";
import { ToastNotice } from "@/components/ui/toast-notice";

const grades: ReviewGrade[] = ["again", "hard", "good", "easy"];

type ReviewBuckets = {
  mustIds: string[];
  shouldIds: string[];
  canIds: string[];
};

export function ReviewTrainer({
  initialItems,
  locale,
  weakTypes,
  sessionType = "formal",
  exitHref = "/study/today",
  exitLabel,
  title,
  description,
  eyebrow,
  doneTitle,
  doneBody,
  buckets
}: {
  initialItems: ReviewItem[];
  locale: AppLocale;
  weakTypes: LearningType[];
  sessionType?: ReviewSessionType;
  exitHref?: string;
  exitLabel?: string;
  title?: string;
  description?: string;
  eyebrow?: string;
  doneTitle?: string;
  doneBody?: string;
  buckets?: ReviewBuckets;
}) {
  const [items, setItems] = useState(initialItems);
  const [showBack, setShowBack] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<"success" | "error">("success");
  const [busy, setBusy] = useState(false);
  const [cardStartAt, setCardStartAt] = useState(() => Date.now());
  const copy = getLocaleCopy(locale);
  const totalCount = initialItems.length;
  const remainingMustCount = buckets ? items.filter((item) => buckets.mustIds.includes(item.id)).length : 0;
  const remainingShouldCount = buckets ? items.filter((item) => buckets.shouldIds.includes(item.id)).length : 0;
  const remainingCanCount = buckets ? items.filter((item) => buckets.canIds.includes(item.id)).length : 0;

  const current = items[0];
  const currentBucket = current && buckets
    ? buckets.mustIds.includes(current.id)
      ? copy.reviewPage.bucketMust(remainingMustCount)
      : buckets.shouldIds.includes(current.id)
        ? copy.reviewPage.bucketShould(remainingShouldCount)
        : copy.reviewPage.bucketCan(remainingCanCount)
    : null;

  useEffect(() => {
    setCardStartAt(Date.now());
  }, [current?.id]);

  async function submitGrade(grade: ReviewGrade) {
    if (!current) {
      return;
    }

    setBusy(true);
    const response = await fetch("/api/reviews/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        itemId: current.id,
        grade,
        sessionType,
        confidence: grade === "again" ? 0.2 : grade === "hard" ? 0.45 : grade === "good" ? 0.75 : 0.95,
        responseMs: Math.max(0, Date.now() - cardStartAt)
      })
    });

    if (!response.ok) {
      setStatusTone("error");
      setStatus(copy.reviewPage.submitError);
      setBusy(false);
      return;
    }

    const result = (await response.json()) as {
      schedule?: { scheduledDays?: number; state?: string };
    };
    const scheduledDays = result.schedule?.scheduledDays;
    setStatusTone("success");
    setStatus(
      scheduledDays !== undefined
        ? `${copy.reviewPage.updated}${scoreToLabel(grade, locale)} · ${scheduledDays} ${locale === "zh-TW" ? "天後" : "days"}`
        : `${copy.reviewPage.updated}${scoreToLabel(grade, locale)}。`,
    );
    setShowBack(false);
    startTransition(() => {
      setItems((prev) => prev.slice(1));
      setBusy(false);
    });
  }

  if (!current) {
    return (
      <StudySessionShell
        description={description ?? copy.reviewPage.body}
        exitHref={exitHref}
        exitLabel={exitLabel ?? copy.reviewPage.back}
        eyebrow={eyebrow ?? copy.reviewPage.eyebrow}
        progressCurrent={totalCount}
        progressLabel={copy.reviewPage.progressLabel(totalCount, Math.max(totalCount, 1))}
        progressTotal={Math.max(totalCount, 1)}
        title={title ?? copy.reviewPage.title}
      >
        <ToastNotice message={status} tone={statusTone} />
        <div className="study-topic-card review-finish-card">
          <div className="study-topic-stack">
            <div className="eyebrow">{copy.reviewPage.reviewDone}</div>
            <h2 className="study-topic-title">{doneTitle ?? copy.reviewPage.reviewDoneTitle}</h2>
            <p className="study-topic-body">{doneBody ?? copy.reviewPage.reviewDoneBody}</p>
            {buckets ? (
              <div className="study-topic-support-list">
                <div className="study-topic-support">{copy.reviewPage.mustDone}</div>
                <div className="study-topic-support">{copy.reviewPage.formalReviewLocked}</div>
              </div>
            ) : null}
          </div>
          <div className="study-topic-actions">
            <Link className="button" href={exitHref}>
              {exitLabel ?? copy.reviewPage.returnToToday}
            </Link>
          </div>
        </div>
      </StudySessionShell>
    );
  }

  return (
    <StudySessionShell
      description={description ?? copy.reviewPage.body}
      exitHref={exitHref}
      exitLabel={exitLabel ?? copy.reviewPage.back}
      eyebrow={eyebrow ?? copy.reviewPage.eyebrow}
      progressCurrent={totalCount - items.length + 1}
      progressLabel={copy.reviewPage.progressLabel(totalCount - items.length + 1, totalCount)}
      progressTotal={totalCount}
      title={title ?? copy.reviewPage.title}
    >
      <ToastNotice message={status} tone={statusTone} />
      <div className="study-topic-card review-session-card">
        <div className="study-topic-stack">
          <div className="eyebrow">{copy.reviewPage.currentCard}</div>
          <h2 className="study-topic-title">{current.front}</h2>
          <p className="study-topic-body">
            {copy.reviewPage.hint}
            {current.hint}
          </p>
          {!showBack ? (
            <div className="review-commitment-box">
              <div className="eyebrow">{locale === "zh-TW" ? "先回想" : "Recall first"}</div>
              <p className="subtle">
                {locale === "zh-TW"
                  ? "在翻答案前，先在心中或紙上說出答案。這次回想會比重看更能保住長期記憶。"
                  : "Before revealing the answer, say or write it from memory. Retrieval is the work that protects long-term memory."}
              </p>
            </div>
          ) : null}
          <div className="study-topic-support-list">
            <div className="study-topic-support review-focus-support">
              <div className="eyebrow">{copy.reviewPage.pressureLabel}</div>
              <p className="subtle">{currentBucket ?? copy.reviewPage.pressureBody}</p>
              <div className="today-focus-pills">
                {weakTypes.map((type) => (
                  <span key={type} className="pill lesson-meta-pill-secondary">
                    {copy.reviewPage.learningTypeLabel(type)}
                  </span>
                ))}
              </div>
            </div>
            {buckets ? (
              <ReviewPlanningCard
                body={copy.reviewPage.bucketBody}
                bucketSummary={{
                  must: copy.reviewPage.bucketMust(remainingMustCount),
                  should: copy.reviewPage.bucketShould(remainingShouldCount),
                  can: copy.reviewPage.bucketCan(remainingCanCount),
                }}
                className="study-topic-support"
                locale={locale}
                title={copy.reviewPage.bucketEyebrow}
                weakLabel={copy.reviewPage.pressureLabel}
                weakTypes={[]}
              />
            ) : null}
          </div>
        </div>
        {showBack ? (
          <div className="study-topic-feedback review-answer-box">
            <div className="eyebrow">{copy.reviewPage.answerLabel}</div>
            <strong>{current.back}</strong>
          </div>
        ) : null}
        {showBack ? (
          <div className="study-topic-stack review-grade-stack">
            <div className="eyebrow">{copy.reviewPage.gradingLabel}</div>
            <div className="review-grade-grid">
              {grades.map((grade) => (
                <button
                  key={grade}
                  className={grade === "good" ? "button" : "ghost-button"}
                  disabled={busy}
                  onClick={() => submitGrade(grade)}
                  type="button"
                >
                  {scoreToLabel(grade, locale)}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <div className="study-topic-actions">
          {!showBack ? (
            <button className="button" onClick={() => setShowBack(true)} type="button">
              {copy.reviewPage.showAnswer}
            </button>
          ) : null}
        </div>
      </div>
    </StudySessionShell>
  );
}
