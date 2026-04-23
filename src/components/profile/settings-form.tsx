"use client";

import { FormEvent, useState } from "react";
import { AppLocale, getLocaleCopy } from "@/lib/i18n";

export function SettingsForm({
  locale
}: {
  locale: AppLocale;
}) {
  const copy = getLocaleCopy(locale);
  const [selectedLocale, setSelectedLocale] = useState<AppLocale>(locale);
  const [pending, setPending] = useState(false);
  const dirty = selectedLocale !== locale;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!dirty) {
      return;
    }

    setPending(true);
    window.location.assign(`/locale?lang=${encodeURIComponent(selectedLocale)}&next=${encodeURIComponent("/profile/settings")}`);
  }

  return (
    <form className="stack settings-shell" onSubmit={onSubmit}>
      <div className="review-card stack">
        <div className="stack">
          <div className="eyebrow">{copy.settingsPage.languageEyebrow}</div>
        </div>
        <div className="choice-grid settings-choice-grid" role="radiogroup" aria-label={copy.settingsPage.language}>
          <button
            aria-checked={selectedLocale === "zh-TW"}
            className={`choice-card settings-choice-card${selectedLocale === "zh-TW" ? " active" : ""}`}
            onClick={() => setSelectedLocale("zh-TW")}
            role="radio"
            type="button"
          >
            <span className="choice-card-copy">
              <span className="choice-card-title">{copy.common.zhTw}</span>
              <span className="choice-card-description">Traditional Chinese</span>
            </span>
          </button>
          <button
            aria-checked={selectedLocale === "en"}
            className={`choice-card settings-choice-card${selectedLocale === "en" ? " active" : ""}`}
            onClick={() => setSelectedLocale("en")}
            role="radio"
            type="button"
          >
            <span className="choice-card-copy">
              <span className="choice-card-title">{copy.common.en}</span>
              <span className="choice-card-description">English</span>
            </span>
          </button>
        </div>
      </div>
      {dirty ? (
        <div className="button-row settings-actions">
          <button className="button" disabled={pending} type="submit">
            {pending ? copy.settingsPage.saving : copy.settingsPage.save}
          </button>
        </div>
      ) : null}
    </form>
  );
}
