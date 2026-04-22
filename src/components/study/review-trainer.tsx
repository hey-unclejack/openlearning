"use client";

import { scoreToLabel } from "@/lib/srs";
import { ReviewGrade, ReviewItem } from "@/lib/types";
import { startTransition, useState } from "react";

const grades: ReviewGrade[] = ["again", "hard", "good", "easy"];

export function ReviewTrainer({ initialItems }: { initialItems: ReviewItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [showBack, setShowBack] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
      setStatus("送出失敗，請重試。");
      setBusy(false);
      return;
    }

    setStatus(`已更新：${scoreToLabel(grade)}。`);
    setShowBack(false);
    startTransition(() => {
      setItems((prev) => prev.slice(1));
      setBusy(false);
    });
  }

  if (!current) {
    return (
      <div className="review-card">
        <div className="eyebrow">Review Done</div>
        <h2 className="section-title">今天到期的卡片已完成</h2>
        <p className="subtle">接下來去完成今日新課程，讓系統明天開始替你安排下一輪複習。</p>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="review-card">
        <div className="eyebrow">Due Card</div>
        <h2 className="section-title">{current.front}</h2>
        <p className="subtle">先在腦中回想，再翻答案。提示：{current.hint}</p>
        {showBack ? (
          <div className="muted-box">
            <strong>{current.back}</strong>
          </div>
        ) : null}
        <div className="button-row">
          {!showBack ? (
            <button className="button" onClick={() => setShowBack(true)} type="button">
              顯示答案
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
                  {scoreToLabel(grade)}
                </button>
              ))
            : null}
        </div>
      </div>
      <div className="status">{status}</div>
      <div className="subtle">剩餘 {items.length} 張到期卡片</div>
    </div>
  );
}
