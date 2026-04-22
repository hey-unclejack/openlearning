"use client";

import { useRouter } from "next/navigation";
import { FormEvent, startTransition, useState } from "react";

export function OnboardingForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    const response = await fetch("/api/onboarding", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      setPending(false);
      setError("設定失敗，請稍後再試。");
      return;
    }

    startTransition(() => {
      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <form className="stack" onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="targetLanguage">目標語言</label>
        <select defaultValue="English" id="targetLanguage" name="targetLanguage">
          <option>English</option>
          <option>Japanese</option>
          <option>Korean</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="level">目前程度</label>
        <select defaultValue="A2" id="level" name="level">
          <option>A1</option>
          <option>A2</option>
          <option>B1</option>
          <option>B2</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="focus">學習目標</label>
        <input defaultValue="travel conversation" id="focus" name="focus" />
      </div>
      <div className="field">
        <label htmlFor="dailyMinutes">每日學習分鐘數</label>
        <input defaultValue="15" id="dailyMinutes" min="10" name="dailyMinutes" type="number" />
      </div>
      <div className="field">
        <label htmlFor="nativeLanguage">母語</label>
        <input defaultValue="Traditional Chinese" id="nativeLanguage" name="nativeLanguage" />
      </div>
      {error ? <div className="status">{error}</div> : null}
      <div className="button-row">
        <button className="button" disabled={pending} type="submit">
          {pending ? "建立中..." : "建立學習計畫"}
        </button>
      </div>
    </form>
  );
}
