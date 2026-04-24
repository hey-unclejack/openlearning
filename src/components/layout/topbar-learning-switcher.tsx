"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { AppLocale } from "@/lib/i18n";
import { LearnerSpace, LearningDomain } from "@/lib/types";

function GoalIcon({ domain }: { domain?: LearningDomain }) {
  if (domain === "math") {
    return (
      <svg aria-hidden="true" className="topbar-goal-icon" viewBox="0 0 20 20">
        <rect height="14" rx="3" width="12" x="4" y="3" />
        <path d="M7 7h6M7 11h2M11 11h2M7 14h2M11 14h2" />
      </svg>
    );
  }

  if (domain === "exam-cert") {
    return (
      <svg aria-hidden="true" className="topbar-goal-icon" viewBox="0 0 20 20">
        <path d="M10 3 12 7l4 .6-3 2.9.7 4.2L10 12.6l-3.7 2.1.7-4.2-3-2.9L8 7l2-4Z" />
      </svg>
    );
  }

  if (domain === "language") {
    return (
      <svg aria-hidden="true" className="topbar-goal-icon" viewBox="0 0 20 20">
        <path d="M4 5.5h5A3 3 0 0 1 12 8.5v7a3 3 0 0 0-3-3H4v-7Z" />
        <path d="M16 5.5h-4A3 3 0 0 0 9 8.5v7a3 3 0 0 1 3-3h4v-7Z" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="topbar-goal-icon" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="6" />
      <circle cx="10" cy="10" r="2" />
    </svg>
  );
}

export function TopbarLearningSwitcher({
  locale,
  activeLearnerId,
  learners,
  dueCount,
  retentionScore,
}: {
  locale: AppLocale;
  activeLearnerId?: string;
  learners: LearnerSpace[];
  dueCount: number;
  retentionScore: number;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [goalMenuOpen, setGoalMenuOpen] = useState(false);
  const activeLearner = learners.find((learner) => learner.id === activeLearnerId) ?? learners[0];
  const goals = activeLearner?.profile.goals?.filter((goal) => !goal.archivedAt) ?? [];
  const activeGoal = goals.find((goal) => goal.id === activeLearner?.profile.activeGoalId) ?? goals[0];
  const isZh = locale === "zh-TW";

  async function postSwitch(url: string, body: Record<string, string>) {
    setPending(true);
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setPending(false);
    startTransition(() => {
      router.refresh();
    });
  }

  async function switchGoal(goalId: string) {
    setGoalMenuOpen(false);
    await postSwitch("/api/learning-goals/active", { goalId });
  }

  return (
    <>
      <div className="topbar-goal-switcher">
        <button
          aria-label={activeGoal ? `${isZh ? "切換學習目標" : "Switch learning goal"}: ${activeGoal.title}` : (isZh ? "切換學習目標" : "Switch learning goal")}
          aria-expanded={goalMenuOpen}
          aria-haspopup="menu"
          className="topbar-control topbar-icon-button topbar-goal-button"
          disabled={pending || goals.length === 0}
          onClick={() => setGoalMenuOpen((open) => !open)}
          type="button"
        >
          <GoalIcon domain={activeGoal?.domain} />
        </button>
        {goalMenuOpen ? (
          <div className="topbar-menu topbar-goal-menu" role="menu">
            {goals.map((goal) => (
              <button
                className="topbar-menu-item topbar-goal-menu-item"
                data-active={goal.id === activeGoal?.id}
                disabled={pending}
                key={goal.id}
                onClick={() => switchGoal(goal.id)}
                role="menuitem"
                type="button"
              >
                <span className="topbar-menu-icon"><GoalIcon domain={goal.domain} /></span>
                <span className="topbar-menu-copy">
                  <span>{goal.title}</span>
                  <small>{goal.subject ?? goal.domain} · {goal.level}</small>
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div className="topbar-learning-status" aria-label={isZh ? "目前學習狀態" : "Current learning status"}>
        <span><small>{isZh ? "待複習" : "Due"}</small><strong>{dueCount}</strong></span>
        <span><small>{isZh ? "記憶" : "Retention"}</small><strong>{retentionScore}%</strong></span>
      </div>
    </>
  );
}
