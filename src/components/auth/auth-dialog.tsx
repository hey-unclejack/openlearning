"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { AppLocale, getLocaleCopy } from "@/lib/i18n";

export function AuthDialog({
  locale,
  nextPath,
  initialMode
}: {
  locale: AppLocale;
  nextPath: string;
  initialMode?: "login" | "signup";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const copy = getLocaleCopy(locale);

  useEffect(() => {
    if (!initialMode) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [initialMode]);

  function closeDialog() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("auth");
    params.delete("next");
    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }

  if (!initialMode) {
    return null;
  }

  const title = copy.auth.signupTitle;
  const titleLines = copy.auth.signupTitleLines;
  const benefits = copy.auth.signupBenefits;

  return (
    <div className="auth-modal-backdrop" onClick={closeDialog} role="presentation">
      <div
        aria-modal="true"
        className="auth-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <button aria-label={copy.auth.close} className="auth-modal-close" onClick={closeDialog} type="button">
          ×
        </button>
        <div className="auth-modal-frame">
          <div className="auth-modal-header">
            <div className="eyebrow">{copy.auth.modalTitle}</div>
            <div className="auth-modal-title-wrap">
              <h2 className="section-title" aria-label={title}>
                {titleLines.map((line) => (
                  <span key={line} className="auth-title-line">
                    {line}
                  </span>
                ))}
              </h2>
            </div>
          </div>
          <div className="auth-modal-body">
            <div className="auth-benefit-box auth-benefit-box-compact">
              <ul className="auth-benefit-cards">
                {benefits.map((benefit, index) => (
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
            <AuthForm
              compact
              locale={locale}
              loginLabel={copy.auth.signIn}
              nextPath={nextPath}
              submitLabel={copy.auth.signUp}
              showLoginShortcut
            />
          </div>
        </div>
      </div>
    </div>
  );
}
