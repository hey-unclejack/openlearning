"use client";

import { evaluatePracticeAnswer } from "@/lib/content";
import { AppLocale, getLocaleCopy } from "@/lib/i18n";
import { PracticeQuestion } from "@/lib/types";
import { useDeferredValue, useState } from "react";

export function PracticeTrainer({ questions, locale }: { questions: PracticeQuestion[]; locale: AppLocale }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, string>>({});
  const deferredResults = useDeferredValue(results);
  const copy = getLocaleCopy(locale);

  return (
    <div className="stack lesson-practice-section">
      {questions.map((question) => (
        <div key={question.id} className="practice-card lesson-practice-card">
          <div className="practice-card-header">
            <div className="eyebrow">{copy.lesson.practice}</div>
            <span className="pill lesson-practice-pill">{copy.lesson.practiceQuestionLabel(question.id)}</span>
          </div>
          <h3 className="section-title">{question.prompt}</h3>
          <p className="subtle">
            {copy.lesson.promptHint}
            {question.hint}
          </p>
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
              {copy.lesson.checkAnswer}
            </button>
          </div>
          {deferredResults[question.id] ? <div className="muted-box">{deferredResults[question.id]}</div> : null}
        </div>
      ))}
    </div>
  );
}
