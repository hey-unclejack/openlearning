"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AppLocale } from "@/lib/i18n";

export function AdultUnlockControl({
  hasSupervisorPin,
  locale,
}: {
  hasSupervisorPin: boolean;
  locale: AppLocale;
}) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const isZh = locale === "zh-TW";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");

    const response = await fetch("/api/supervisor/mode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "supervisor", pin }),
    });

    setPending(false);

    if (!response.ok) {
      setError(isZh ? "PIN 不正確" : "Incorrect PIN");
      return;
    }

    router.push("/profile/learners");
    router.refresh();
  }

  if (!hasSupervisorPin) {
    return null;
  }

  return (
    <form className="adult-unlock-control" onSubmit={submit}>
      <input
        aria-label={isZh ? "成人 PIN" : "Adult PIN"}
        disabled={pending}
        inputMode="numeric"
        maxLength={6}
        onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))}
        pattern="[0-9]{4,6}"
        placeholder={isZh ? "成人 PIN" : "Adult PIN"}
        type="password"
        value={pin}
      />
      <button disabled={pending || pin.length < 4} type="submit">
        {isZh ? "成人模式" : "Adult"}
      </button>
      {error ? <span className="adult-unlock-error">{error}</span> : null}
    </form>
  );
}
