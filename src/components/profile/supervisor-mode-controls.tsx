"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AppLocale } from "@/lib/i18n";
import { LearnerSpace } from "@/lib/types";

export function SupervisorModeControls({
  hasSupervisorPin,
  learners,
  locale,
}: {
  hasSupervisorPin: boolean;
  learners: LearnerSpace[];
  locale: AppLocale;
}) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [childName, setChildName] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const isZh = locale === "zh-TW";
  const children = learners.filter((learner) => learner.kind === "supervised-student" && !learner.archivedAt);

  async function postJson(url: string, body: Record<string, string>) {
    setPending(true);
    setMessage("");
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setPending(false);
    return response;
  }

  async function setupPin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await postJson("/api/supervisor/pin/setup", { pin });

    if (!response.ok) {
      setMessage(isZh ? "PIN 需要是 4 到 6 位數字。" : "PIN must be 4 to 6 digits.");
      return;
    }

    setPin("");
    setMessage(isZh ? "已設定成人 PIN。" : "Adult PIN is set.");
    router.refresh();
  }

  async function createLearner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await postJson("/api/learners", { displayName: childName });

    if (!response.ok) {
      setMessage(isZh ? "請輸入孩子名稱。" : "Enter a child name.");
      return;
    }

    setChildName("");
    router.refresh();
  }

  async function enterChildMode(learnerId: string) {
    const response = await postJson("/api/supervisor/mode", { mode: "child", learnerId });

    if (!response.ok) {
      setMessage(isZh ? "無法進入兒童模式。" : "Could not enter child mode.");
      return;
    }

    router.push("/study/today");
    router.refresh();
  }

  return (
    <div className="review-card stack supervisor-mode-panel">
      <div>
        <div className="eyebrow">{isZh ? "兒童模式" : "Child mode"}</div>
        <h2 className="section-title">{isZh ? "成人 PIN 與孩子入口" : "Adult PIN and child entry"}</h2>
        <p className="subtle">
          {isZh
            ? "兒童模式只開放 Today、Review、Progress；回到成人管理需要 PIN。"
            : "Child mode only allows Today, Review, and Progress. Returning to adult management requires a PIN."}
        </p>
      </div>

      {!hasSupervisorPin ? (
        <form className="inline-form" onSubmit={setupPin}>
          <input
            disabled={pending}
            inputMode="numeric"
            maxLength={6}
            onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))}
            pattern="[0-9]{4,6}"
            placeholder={isZh ? "設定 4-6 位成人 PIN" : "Set 4-6 digit adult PIN"}
            type="password"
            value={pin}
          />
          <button className="button" disabled={pending || pin.length < 4} type="submit">
            {isZh ? "設定 PIN" : "Set PIN"}
          </button>
        </form>
      ) : (
        <span className="pill lesson-meta-pill-secondary">{isZh ? "已啟用成人 PIN" : "Adult PIN enabled"}</span>
      )}

      <form className="inline-form" onSubmit={createLearner}>
        <input
          disabled={pending}
          onChange={(event) => setChildName(event.target.value)}
          placeholder={isZh ? "新增孩子名稱" : "New child name"}
          value={childName}
        />
        <button className="button-secondary" disabled={pending || !childName.trim()} type="submit">
          {isZh ? "新增孩子" : "Add child"}
        </button>
      </form>

      {children.length > 0 ? (
        <div className="generated-plan-list">
          {children.map((learner) => (
            <article className="generated-plan-item" key={learner.id}>
              <div>
                <h3 className="section-title">{learner.displayName}</h3>
                <p className="subtle">{learner.profile.goals?.length ?? 0} goals</p>
              </div>
              <button className="button" disabled={pending || !hasSupervisorPin} onClick={() => enterChildMode(learner.id)} type="button">
                {isZh ? "進入兒童模式" : "Enter child mode"}
              </button>
            </article>
          ))}
        </div>
      ) : null}

      {message ? <p className="subtle">{message}</p> : null}
    </div>
  );
}
