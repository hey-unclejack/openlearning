"use client";

import { useRouter } from "next/navigation";
import { FormEvent, startTransition, useState } from "react";
import { AppLocale, getLocaleCopy } from "@/lib/i18n";

export function OnboardingForm({ locale }: { locale: AppLocale }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const copy = getLocaleCopy(locale);

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
      setError(copy.onboarding.saveError);
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
        <label htmlFor="targetLanguage">{copy.onboarding.targetLanguage}</label>
        <select defaultValue="English" id="targetLanguage" name="targetLanguage">
          <option>English</option>
          <option>Japanese</option>
          <option>Korean</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="level">{copy.onboarding.level}</label>
        <select defaultValue="A2" id="level" name="level">
          <option>A1</option>
          <option>A2</option>
          <option>B1</option>
          <option>B2</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="focus">{copy.onboarding.focus}</label>
        <input defaultValue="travel conversation" id="focus" name="focus" />
      </div>
      <div className="field">
        <label htmlFor="dailyMinutes">{copy.onboarding.dailyMinutes}</label>
        <input defaultValue="15" id="dailyMinutes" min="10" name="dailyMinutes" type="number" />
      </div>
      <div className="field">
        <label htmlFor="nativeLanguage">{copy.onboarding.nativeLanguage}</label>
        <input defaultValue="Traditional Chinese" id="nativeLanguage" name="nativeLanguage" />
      </div>
      {error ? <div className="status">{error}</div> : null}
      <div className="button-row">
        <button className="button" disabled={pending} type="submit">
          {pending ? copy.onboarding.creating : copy.onboarding.createPlan}
        </button>
      </div>
    </form>
  );
}
