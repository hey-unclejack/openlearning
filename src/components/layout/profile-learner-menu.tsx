"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { AppLocale } from "@/lib/i18n";
import { LearnerSpace } from "@/lib/types";

export function ProfileLearnerMenu({
  activeLearnerId,
  avatarFallback,
  learners,
  locale,
  userAvatarUrl,
  userEmail,
}: {
  activeLearnerId?: string;
  avatarFallback: string;
  learners: LearnerSpace[];
  locale: AppLocale;
  userAvatarUrl?: string;
  userEmail?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);
  const isZh = locale === "zh-TW";
  const activeLearner = learners.find((learner) => learner.id === activeLearnerId) ?? learners[0];
  const activeLearnerFallback = activeLearner?.displayName.trim().charAt(0).toUpperCase() || avatarFallback;

  async function switchLearner(learnerId: string) {
    setPending(true);
    await fetch("/api/learners/active", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ learnerId }),
    });
    setPending(false);
    setOpen(false);
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="profile-menu-wrap" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        aria-label={activeLearner ? `${isZh ? "切換學習者" : "Switch learner"}: ${activeLearner.displayName}` : (isZh ? "切換學習者" : "Switch learner")}
        aria-expanded={open}
        aria-haspopup="menu"
        className="topbar-control topbar-icon-button profile-menu-trigger"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        {userAvatarUrl ? (
          <img alt={activeLearner?.displayName ?? userEmail ?? "Profile"} className="profile-avatar" src={userAvatarUrl} />
        ) : (
          <span className="profile-avatar profile-avatar-fallback">{activeLearnerFallback}</span>
        )}
      </button>
      {open ? (
        <div className="topbar-menu profile-menu" role="menu">
          <div className="profile-menu-heading">
            <strong>{userEmail ?? "OpenLearning"}</strong>
            <span>{isZh ? "切換學習者" : "Switch learner"}</span>
          </div>
          <div className="profile-menu-list">
            {learners.filter((learner) => !learner.archivedAt).map((learner) => (
              <button
                className="topbar-menu-item"
                data-active={learner.id === activeLearner?.id}
                disabled={pending}
                key={learner.id}
                onClick={() => switchLearner(learner.id)}
                role="menuitem"
                type="button"
              >
                <span className="topbar-menu-avatar">{learner.displayName.trim().charAt(0).toUpperCase() || "L"}</span>
                <span className="topbar-menu-copy">
                  <span>{learner.displayName}</span>
                  <small>{learner.kind === "self" ? (isZh ? "本人" : "Self") : (isZh ? "受監護學生" : "Supervised student")}</small>
                </span>
              </button>
            ))}
          </div>
          <Link className="topbar-menu-link" href="/profile">
            {isZh ? "帳號與設定" : "Account and settings"}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
