"use client";

import { evaluatePracticeAnswer } from "@/lib/content";
import { PracticeQuestion } from "@/lib/types";
import { useDeferredValue, useState } from "react";

export function PracticeTrainer({ questions }: { questions: PracticeQuestion[] }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, string>>({});
  const deferredResults = useDeferredValue(results);

  return (
    <div className="stack">
      {questions.map((question) => (
        <div key={question.id} className="practice-card">
          <div className="eyebrow">Practice</div>
          <h3 className="section-title">{question.prompt}</h3>
          <p className="subtle">提示：{question.hint}</p>
          <textarea
            value={answers[question.id] ?? ""}
            onChange={(event) =>
              setAnswers((prev) => ({
                ...prev,
                [question.id]: event.target.value
              }))
            }
          />
          <div className="button-row">
            <button
              className="button"
              onClick={() => {
                const result = evaluatePracticeAnswer(
                  answers[question.id] ?? "",
                  question.answer,
                  question.acceptableAnswers,
                );
                setResults((prev) => ({
                  ...prev,
                  [question.id]: result.feedback
                }));
              }}
              type="button"
            >
              檢查答案
            </button>
          </div>
          {deferredResults[question.id] ? <div className="muted-box">{deferredResults[question.id]}</div> : null}
        </div>
      ))}
    </div>
  );
}
