"use client";

import Link from "next/link";
import { ReactNode } from "react";

export function StudySessionShell({
  eyebrow,
  title,
  description,
  exitHref,
  exitLabel,
  progressCurrent,
  progressTotal,
  progressLabel,
  children
}: {
  eyebrow: string;
  title: string;
  description?: string;
  exitHref: string;
  exitLabel: string;
  progressCurrent: number;
  progressTotal: number;
  progressLabel: string;
  children: ReactNode;
}) {
  const progress = progressTotal > 0 ? Math.min(100, Math.max(0, (progressCurrent / progressTotal) * 100)) : 0;

  return (
    <section className="study-session-shell">
      <div className="study-session-frame">
        <header className="study-session-header">
          <Link className="ghost-button" href={exitHref}>
            {exitLabel}
          </Link>
          <div className="study-session-header-copy">
            <div className="eyebrow">{eyebrow}</div>
            <h1 className="study-session-title">{title}</h1>
            {description ? <p className="study-session-description">{description}</p> : null}
          </div>
          <span className="pill study-session-progress-pill">{progressLabel}</span>
        </header>
        <div
          aria-label={progressLabel}
          aria-valuemax={progressTotal}
          aria-valuemin={0}
          aria-valuenow={progressCurrent}
          className="study-session-progress"
          role="progressbar"
        >
          <span className="study-session-progress-bar" style={{ width: `${progress}%` }} />
        </div>
        <div className="study-session-stage">{children}</div>
      </div>
    </section>
  );
}
