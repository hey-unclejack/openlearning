"use client";

import Link from "next/link";
import { scoreToLabel } from "@/lib/srs";
import { LearningType, ReviewGrade, ReviewItem } from "@/lib/types";
import { startTransition, useState } from "react";
import { AppLocale, getLocaleCopy } from "@/lib/i18n";
import { StudySessionShell } from "@/components/study/study-session-shell";
import { ToastNotice } from "@/components/ui/toast-notice";

const grades: ReviewGrade[] = ["again", "hard", "good", "easy"];

export function ReviewTrainer({
  initialItems,
  locale,
  weakTypes
}: {
  initialItems: ReviewItem[];
  locale: AppLocale;
  weakTypes: LearningType[];
}) {
  const [items, setItems] = useState(initialItems);
  const [showBack, setShowBack] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<"success" | "error">("success");
  const [busy, setBusy] = useState(false);
  const copy = getLocaleCopy(locale);
  const totalCount = initialItems.length;

  const current = items[0];

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
      body: JSON.stringify({ itemId: current.id, grade })
    });

    if (!response.ok) {
      setStatusTone("error");
      setStatus(copy.reviewPage.submitError);
      setBusy(false);
      return;
    }

    setStatusTone("success");
    setStatus(`${copy.reviewPage.updated}${scoreToLabel(grade, locale)}。`);
    setShowBack(false);
    startTransition(() => {
      setItems((prev) => prev.slice(1));
      setBusy(false);
    });
  }

  if (!current) {
    return (
      <StudySessionShell
        description={copy.reviewPage.body}
        exitHref="/study/today"
        exitLabel={copy.reviewPage.back}
        eyebrow={copy.reviewPage.eyebrow}
        progressCurrent={totalCount}
        progressLabel={copy.reviewPage.progressLabel(totalCount, Math.max(totalCount, 1))}
        progressTotal={Math.max(totalCount, 1)}
        title={copy.reviewPage.title}
      >
        <ToastNotice message={status} tone={statusTone} />
        <div className="study-topic-card review-finish-card">
          <div className="study-topic-stack">
            <div className="eyebrow">{copy.reviewPage.reviewDone}</div>
            <h2 className="study-topic-title">{copy.reviewPage.reviewDoneTitle}</h2>
            <p className="study-topic-body">{copy.reviewPage.reviewDoneBody}</p>
          </div>
          <div className="study-topic-actions">
            <Link className="button" href="/study/today">
              {copy.reviewPage.returnToToday}
            </Link>
          </div>
        </div>
      </StudySessionShell>
    );
  }

  return (
    <StudySessionShell
      description={copy.reviewPage.body}
      exitHref="/study/today"
      exitLabel={copy.reviewPage.back}
      eyebrow={copy.reviewPage.eyebrow}
      progressCurrent={totalCount - items.length + 1}
      progressLabel={copy.reviewPage.progressLabel(totalCount - items.length + 1, totalCount)}
      progressTotal={totalCount}
      title={copy.reviewPage.title}
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
          <div className="study-topic-support-list">
            <div className="study-topic-support">
              <div className="eyebrow">{copy.reviewPage.pressureLabel}</div>
              <p className="subtle">{copy.reviewPage.pressureBody}</p>
              <div className="today-focus-pills">
                {weakTypes.map((type) => (
                  <span key={type} className="pill lesson-meta-pill-secondary">
                    {copy.reviewPage.learningTypeLabel(type)}
                  </span>
                ))}
              </div>
            </div>
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
