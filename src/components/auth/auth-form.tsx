"use client";

import { useState } from "react";
import { AppLocale, getLocaleCopy } from "@/lib/i18n";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { ToastNotice } from "@/components/ui/toast-notice";

function GoogleMark() {
  return (
    <svg aria-hidden="true" className="google-mark" viewBox="0 0 18 18">
      <path
        d="M17.64 9.2045c0-.6382-.0573-1.2518-.1636-1.8409H9v3.4818h4.8436a4.142 4.142 0 0 1-1.8 2.7164v2.2582h2.9081c1.7018-1.5664 2.6883-3.8737 2.6883-6.6155Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.4673-.8055 5.9564-2.1791l-2.9081-2.2582c-.8055.54-1.8364.8591-3.0483.8591-2.3441 0-4.3282-1.5832-5.0364-3.7105H.9573v2.3318A9 9 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.9636 10.7109A5.4097 5.4097 0 0 1 3.6818 9c0-.5932.1023-1.1682.2818-1.7109V4.9573H.9573A9 9 0 0 0 0 9c0 1.4523.3477 2.8277.9573 4.0427l3.0063-2.3318Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.3455l2.5813-2.5814C13.4632.8918 11.4268 0 9 0A9 9 0 0 0 .9573 4.9573l3.0063 2.3318C4.6718 5.1627 6.6559 3.5795 9 3.5795Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function AuthForm({
  nextPath = "/dashboard",
  submitLabel,
  loginLabel,
  locale,
  compact = false,
  showLoginShortcut = false
}: {
  nextPath?: string;
  submitLabel?: string;
  loginLabel?: string;
  locale: AppLocale;
  compact?: boolean;
  showLoginShortcut?: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const copy = getLocaleCopy(locale);
  const signupBenefits = copy.auth.signupBenefits;

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
      if (runtimeError instanceof Error && runtimeError.message === "Supabase browser env is missing") {
        setError(copy.auth.unavailable);
      } else {
        setError(runtimeError instanceof Error ? runtimeError.message : copy.auth.unavailable);
      }
      setPending(false);
    }
  }

  return (
    <div className="stack auth-form-stack">
      <ToastNotice message={error} tone="error" />
      {!compact ? (
        <div className="auth-benefit-box">
          <ul className="auth-benefit-cards">
            {signupBenefits.map((benefit, index) => (
              <li key={benefit.title} className="auth-benefit-card">
                <div className="auth-benefit-index">{String(index + 1).padStart(2, "0")}</div>
                <div className="auth-benefit-copy">
                  <h3>{benefit.title}</h3>
                  <p>{benefit.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="button-row auth-form-actions">
        <button className="auth-google-button" disabled={pending} onClick={signInWithGoogle} type="button">
          <span className="auth-google-button-mark">
            <GoogleMark />
          </span>
          <span className="auth-google-button-label">
          {pending ? copy.auth.redirecting : submitLabel ?? copy.auth.signIn}
          </span>
        </button>
      </div>
      {showLoginShortcut ? (
        <div className="auth-login-shortcut">
          <div className="auth-divider" />
          <p className="auth-shortcut-text">{copy.auth.hasAccountPrompt}</p>
          <button className="auth-google-button auth-google-button-secondary" disabled={pending} onClick={signInWithGoogle} type="button">
            <span className="auth-google-button-mark">
              <GoogleMark />
            </span>
            <span className="auth-google-button-label">{loginLabel ?? copy.auth.signIn}</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
