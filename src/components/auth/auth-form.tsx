"use client";

import { useState } from "react";
import { AppLocale, getLocaleCopy } from "@/lib/i18n";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export function AuthForm({
  nextPath = "/dashboard",
  submitLabel,
  locale
}: {
  nextPath?: string;
  submitLabel?: string;
  locale: AppLocale;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const copy = getLocaleCopy(locale);

  async function signInWithGoogle() {
    setPending(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo
        }
      });

      if (signInError) {
        setError(signInError.message);
        setPending(false);
      }
    } catch (runtimeError) {
      setError(runtimeError instanceof Error ? runtimeError.message : "Google sign-in failed");
      setPending(false);
    }
  }

  return (
    <div className="stack">
      <div className="muted-box">
        <strong>{copy.auth.accessPolicyTitle}</strong>
        <div className="subtle">{copy.auth.accessPolicyBody}</div>
      </div>
      {error ? <div className="status">{error}</div> : null}
      <div className="button-row">
        <button className="button" disabled={pending} onClick={signInWithGoogle} type="button">
          {pending ? copy.auth.redirecting : submitLabel ?? copy.auth.signIn}
        </button>
      </div>
    </div>
  );
}
