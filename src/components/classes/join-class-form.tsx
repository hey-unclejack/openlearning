"use client";

import { useRouter } from "next/navigation";
import { FormEvent, startTransition, useState } from "react";
import { AppLocale } from "@/lib/i18n";
import { LearnerSpace } from "@/lib/types";

export function JoinClassForm({
  code,
  locale,
  learners,
}: {
  code: string;
  locale: AppLocale;
  learners: LearnerSpace[];
}) {
  const router = useRouter();
  const isZh = locale === "zh-TW";
  const childLearners = learners.filter((learner) => learner.kind === "supervised-student" && !learner.archivedAt);
  const [mode, setMode] = useState(childLearners[0] ? "existing" : "new");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    const response = await fetch(`/api/class-invites/${encodeURIComponent(code)}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        mode === "existing"
          ? { childLearnerId: String(form.get("childLearnerId") ?? "") }
          : { childName: String(form.get("childName") ?? "") },
      ),
    });
    const payload = await response.json() as { ok: boolean; error?: string };
    setPending(false);

    if (!payload.ok) {
      setError(payload.error ?? "Failed to join class.");
      return;
    }

    startTransition(() => {
      router.push("/study/today");
      router.refresh();
    });
  }

  return (
    <form className="review-card stack" onSubmit={onSubmit}>
      <div className="choice-grid settings-choice-grid" role="radiogroup" aria-label={isZh ? "選擇孩子" : "Choose child"}>
        {childLearners.length > 0 ? (
          <button className={`choice-card${mode === "existing" ? " active" : ""}`} onClick={() => setMode("existing")} type="button">
            <span className="choice-card-copy">
              <span className="choice-card-title">{isZh ? "選擇既有孩子" : "Use an existing child"}</span>
              <span className="choice-card-description">{isZh ? "把老師 goal 加到已建立的孩子檔案。" : "Add the teacher goal to an existing child profile."}</span>
            </span>
          </button>
        ) : null}
        <button className={`choice-card${mode === "new" ? " active" : ""}`} onClick={() => setMode("new")} type="button">
          <span className="choice-card-copy">
            <span className="choice-card-title">{isZh ? "新增孩子" : "Create a child profile"}</span>
            <span className="choice-card-description">{isZh ? "建立獨立進度、SRS 與兒童模式。" : "Create isolated progress, SRS, and child mode."}</span>
          </span>
        </button>
      </div>
      {mode === "existing" ? (
        <label className="field">
          {isZh ? "孩子" : "Child"}
          <select name="childLearnerId">
            {childLearners.map((learner) => (
              <option key={learner.id} value={learner.id}>{learner.displayName}</option>
            ))}
          </select>
        </label>
      ) : (
        <label className="field">
          {isZh ? "孩子名字" : "Child name"}
          <input name="childName" placeholder={isZh ? "例如：小安" : "e.g. Alex"} required />
        </label>
      )}
      {error ? <div className="toast-inline error">{error}</div> : null}
      <div className="button-row">
        <button className="button" disabled={pending} type="submit">
          {pending ? (isZh ? "加入中..." : "Joining...") : (isZh ? "加入班級 goal" : "Join class goal")}
        </button>
      </div>
    </form>
  );
}
