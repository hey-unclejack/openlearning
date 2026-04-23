"use client";

import { useRouter } from "next/navigation";
import { FormEvent, startTransition, useState } from "react";
import { AppLocale, getLocaleCopy } from "@/lib/i18n";
import { ToastNotice } from "@/components/ui/toast-notice";
import { LearningFocus, NativeLanguage, ProficiencyLevel, TargetLanguage } from "@/lib/types";

const STEP_COUNT = 4;

function ChoiceCards<T extends string>({
  name,
  options,
  value,
  onChange
}: {
  name: string;
  options: Array<{ value: T; label?: string; title?: string; description?: string }>;
  value?: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="choice-grid" role="radiogroup" aria-label={name}>
      {options.map((option) => (
        <button
          key={option.value}
          className={`choice-card${value === option.value ? " active" : ""}`}
          onClick={() => onChange(option.value)}
          type="button"
        >
          {option.title ? (
            <span className="choice-card-copy">
              <span className="choice-card-title">{option.title}</span>
              {option.description ? <span className="choice-card-description">{option.description}</span> : null}
            </span>
          ) : (
            option.label
          )}
        </button>
      ))}
      <input name={name} type="hidden" value={value ?? ""} />
    </div>
  );
}

export function OnboardingForm({
  locale,
  nextPath = "/dashboard",
  defaults,
  returnPath
}: {
  locale: AppLocale;
  nextPath?: string;
  returnPath?: string;
  defaults?: {
    targetLanguage?: TargetLanguage;
    level?: ProficiencyLevel;
    focus?: LearningFocus;
    dailyMinutes?: number;
    nativeLanguage?: NativeLanguage;
  };
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [targetLanguage, setTargetLanguage] = useState<TargetLanguage | undefined>(defaults?.targetLanguage);
  const [level, setLevel] = useState<ProficiencyLevel | undefined>(defaults?.level);
  const [focus, setFocus] = useState<LearningFocus | undefined>(defaults?.focus);
  const [dailyMinutes, setDailyMinutes] = useState<string | undefined>(
    defaults?.dailyMinutes ? String(defaults.dailyMinutes) : undefined
  );
  const [nativeLanguage, setNativeLanguage] = useState<NativeLanguage | undefined>(defaults?.nativeLanguage);
  const copy = getLocaleCopy(locale);
  const targetLanguageOptions: Array<{ value: TargetLanguage; label: string }> = [
    { value: "english", label: copy.profileLabels.targetLanguage.english }
  ];
  const levelOptions: Array<{ value: ProficiencyLevel; title: string; description: string }> = [
    {
      value: "A1",
      title: copy.onboarding.levelOptionA1Title,
      description: copy.onboarding.levelOptionA1Description
    },
    {
      value: "A2",
      title: copy.onboarding.levelOptionA2Title,
      description: copy.onboarding.levelOptionA2Description
    },
    {
      value: "B1",
      title: copy.onboarding.levelOptionB1Title,
      description: copy.onboarding.levelOptionB1Description
    },
    {
      value: "B2",
      title: copy.onboarding.levelOptionB2Title,
      description: copy.onboarding.levelOptionB2Description
    }
  ];
  const focusOptions: Array<{ value: LearningFocus; label: string }> = [
    { value: "travel", label: copy.profileLabels.focus.travel },
    { value: "daily", label: copy.profileLabels.focus.daily },
    { value: "work", label: copy.profileLabels.focus.work },
    { value: "exam", label: copy.profileLabels.focus.exam }
  ];
  const minuteOptions: Array<{ value: string; label: string }> = [
    { value: "10", label: copy.onboarding.optionTenMinutes },
    { value: "15", label: copy.onboarding.optionFifteenMinutes },
    { value: "20", label: copy.onboarding.optionTwentyMinutes },
    { value: "30", label: copy.onboarding.optionThirtyMinutes }
  ];
  const nativeLanguageOptions: Array<{ value: NativeLanguage; label: string }> = [
    { value: "zh-TW", label: copy.profileLabels.nativeLanguage["zh-TW"] }
  ];

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isStepComplete(step)) {
      return;
    }

    if (step < STEP_COUNT) {
      setStep((current) => current + 1);
      return;
    }

    setPending(true);
    setError(null);

    const response = await fetch("/api/onboarding", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        targetLanguage: targetLanguage!,
        level: level!,
        focus: focus!,
        dailyMinutes: dailyMinutes!,
        nativeLanguage: nativeLanguage!
      })
    });

    if (!response.ok) {
      setPending(false);
      setError(copy.onboarding.saveError);
      return;
    }

    startTransition(() => {
      const destination = returnPath?.startsWith("/") ? returnPath : nextPath.startsWith("/") ? nextPath : "/dashboard";
      const refreshUrl = destination.startsWith("/profile") || destination.startsWith("/onboarding")
        ? `${destination}${destination.includes("?") ? "&" : "?"}updated=${Date.now()}`
        : destination;
      router.replace(refreshUrl);
      router.refresh();
    });
  }

  function isStepComplete(currentStep: number) {
    if (currentStep === 1) {
      return Boolean(nativeLanguage && targetLanguage);
    }

    if (currentStep === 2) {
      return Boolean(level);
    }

    if (currentStep === 3) {
      return Boolean(focus);
    }

    return Boolean(dailyMinutes);
  }

  const stepMeta = [
    {
      title: copy.onboarding.stepIdentityTitle,
      body: copy.onboarding.stepIdentityBody,
      field: (
        <div className="stack">
          <div className="field">
            <label htmlFor="nativeLanguage">{copy.onboarding.nativeLanguage}</label>
            <ChoiceCards name="nativeLanguage" onChange={setNativeLanguage} options={nativeLanguageOptions} value={nativeLanguage} />
          </div>
          <div className="field">
            <label htmlFor="targetLanguage">{copy.onboarding.targetLanguage}</label>
            <ChoiceCards name="targetLanguage" onChange={setTargetLanguage} options={targetLanguageOptions} value={targetLanguage} />
          </div>
        </div>
      )
    },
    {
      title: copy.onboarding.stepLevelTitle,
      body: copy.onboarding.stepLevelBody,
      field: (
        <div className="field">
          <label htmlFor="level">{copy.onboarding.level}</label>
          <ChoiceCards name="level" onChange={setLevel} options={levelOptions} value={level} />
        </div>
      )
    },
    {
      title: copy.onboarding.stepFocusTitle,
      body: copy.onboarding.stepFocusBody,
      field: (
        <div className="field">
          <label htmlFor="focus">{copy.onboarding.focus}</label>
          <ChoiceCards name="focus" onChange={setFocus} options={focusOptions} value={focus} />
        </div>
      )
    },
    {
      title: copy.onboarding.stepRhythmTitle,
      body: copy.onboarding.stepRhythmBody,
      field: (
        <div className="field">
          <label htmlFor="dailyMinutes">{copy.onboarding.dailyMinutes}</label>
          <ChoiceCards name="dailyMinutes" onChange={setDailyMinutes} options={minuteOptions} value={dailyMinutes} />
        </div>
      )
    }
  ][step - 1];
  const canContinue = isStepComplete(step);

  return (
    <form className="stack onboarding-wizard" onSubmit={onSubmit}>
      <ToastNotice message={error} tone="error" />
      <div className="onboarding-progress">
        {Array.from({ length: STEP_COUNT }, (_, index) => (
          <div key={index} className={`onboarding-progress-step${index + 1 <= step ? " active" : ""}`}>
            <span>{index + 1}</span>
          </div>
        ))}
      </div>
      <div className="eyebrow">
        {copy.onboarding.step} {step}/{STEP_COUNT}
      </div>
      <div className="stack">
        <h3 className="section-title">{stepMeta.title}</h3>
        <p className="subtle">{stepMeta.body}</p>
      </div>
      {stepMeta.field}
      <div className="button-row">
        {step > 1 ? (
          <button className="button-secondary" disabled={pending} onClick={() => setStep((current) => current - 1)} type="button">
            {copy.onboarding.back}
          </button>
        ) : null}
        <button className="button" disabled={pending || !canContinue} type="submit">
          {pending ? copy.onboarding.creating : step === STEP_COUNT ? copy.onboarding.finish : copy.onboarding.next}
        </button>
      </div>
    </form>
  );
}
