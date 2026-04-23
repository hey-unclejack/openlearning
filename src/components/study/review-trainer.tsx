"use client";

import { scoreToLabel } from "@/lib/srs";
import { ReviewGrade, ReviewItem } from "@/lib/types";
import { startTransition, useState } from "react";
import { AppLocale, getLocaleCopy } from "@/lib/i18n";
import { ToastNotice } from "@/components/ui/toast-notice";

const grades: ReviewGrade[] = ["again", "hard", "good", "easy"];

export function ReviewTrainer({ initialItems, locale }: { initialItems: ReviewItem[]; locale: AppLocale }) {
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
      <div className="review-card review-finish-card">
        <div className="review-summary-head">
          <div className="eyebrow">{copy.reviewPage.reviewDone}</div>
          <span className="pill lesson-meta-pill-secondary">{copy.reviewPage.donePill}</span>
        </div>
        <h2 className="section-title">{copy.reviewPage.reviewDoneTitle}</h2>
        <p className="subtle">{copy.reviewPage.reviewDoneBody}</p>
      </div>
    );
  }

  return (
    <div className="stack review-trainer-stack">
      <ToastNotice message={status} tone={statusTone} />
      <div className="review-card review-session-card">
        <div className="review-card-topline">
          <div className="eyebrow">{copy.reviewPage.currentCard}</div>
          <span className="pill">{copy.reviewPage.progressLabel(totalCount - items.length + 1, totalCount)}</span>
        </div>
        <h2 className="section-title">{current.front}</h2>
        <p className="subtle">
          {copy.reviewPage.hint}
          {current.hint}
        </p>
        {showBack ? (
          <div className="muted-box review-answer-box">
            <div className="eyebrow">{copy.reviewPage.answerLabel}</div>
            <strong>{current.back}</strong>
          </div>
        ) : null}
        <div className="button-row review-action-row">
          {!showBack ? (
            <button className="button" onClick={() => setShowBack(true)} type="button">
              {copy.reviewPage.showAnswer}
            </button>
          ) : null}
        </div>
        {showBack ? (
          <div className="stack review-grade-stack">
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
      </div>
      <div className="subtle review-remaining-text">{copy.reviewPage.remaining(items.length)}</div>
    </div>
  );
}
