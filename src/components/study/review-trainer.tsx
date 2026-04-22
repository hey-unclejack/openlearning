"use client";

import { scoreToLabel } from "@/lib/srs";
import { ReviewGrade, ReviewItem } from "@/lib/types";
import { startTransition, useState } from "react";
import { AppLocale, getLocaleCopy } from "@/lib/i18n";

const grades: ReviewGrade[] = ["again", "hard", "good", "easy"];

export function ReviewTrainer({ initialItems, locale }: { initialItems: ReviewItem[]; locale: AppLocale }) {
  const [items, setItems] = useState(initialItems);
  const [showBack, setShowBack] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const copy = getLocaleCopy(locale);

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
      setStatus(copy.reviewPage.submitError);
      setBusy(false);
      return;
    }

    setStatus(`${copy.reviewPage.updated}${scoreToLabel(grade, locale)}。`);
    setShowBack(false);
    startTransition(() => {
      setItems((prev) => prev.slice(1));
      setBusy(false);
    });
  }

  if (!current) {
    return (
      <div className="review-card">
        <div className="eyebrow">{copy.reviewPage.reviewDone}</div>
        <h2 className="section-title">{copy.reviewPage.reviewDoneTitle}</h2>
        <p className="subtle">{copy.reviewPage.reviewDoneBody}</p>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="review-card">
        <div className="eyebrow">{copy.reviewPage.dueCard}</div>
        <h2 className="section-title">{current.front}</h2>
        <p className="subtle">
          {copy.reviewPage.hint}
          {current.hint}
        </p>
        {showBack ? (
          <div className="muted-box">
            <strong>{current.back}</strong>
          </div>
        ) : null}
        <div className="button-row">
          {!showBack ? (
            <button className="button" onClick={() => setShowBack(true)} type="button">
              {copy.reviewPage.showAnswer}
            </button>
          ) : null}
          {showBack
            ? grades.map((grade) => (
                <button
                  key={grade}
                  className={grade === "good" ? "button" : "ghost-button"}
                  disabled={busy}
                  onClick={() => submitGrade(grade)}
                  type="button"
                >
                  {scoreToLabel(grade, locale)}
                </button>
              ))
            : null}
        </div>
      </div>
      <div className="status">{status}</div>
      <div className="subtle">{copy.reviewPage.remaining(items.length)}</div>
    </div>
  );
}
