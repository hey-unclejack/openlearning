import type { Route } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ReactNode } from "react";
import { AppLocale, getLocaleCopy } from "@/lib/i18n";
import { SiteTopbar } from "@/components/layout/site-topbar";
import { APP_AVATAR_COOKIE, getCurrentUser, getSessionIdFromHeaders, resolveAvatarCookie } from "@/lib/session";
import { getActiveLearningGoal, learningDomainLabel } from "@/lib/learning-goals";
import { deriveRetentionScore, deriveStats, getTodayReviewPlan, readState } from "@/lib/store";

function buildWeeklyActivity(reviewedAtValues: string[], locale: AppLocale) {
  const today = new Date();
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  start.setDate(today.getDate() - today.getDay());
  const weekdayLabels =
    locale === "zh-TW" ? ["日", "一", "二", "三", "四", "五", "六"] : ["S", "M", "T", "W", "T", "F", "S"];

  const reviewedDays = new Set(
    reviewedAtValues.map((value) => {
      const date = new Date(value);
      date.setHours(0, 0, 0, 0);
      return date.toISOString().slice(0, 10);
    }),
  );

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const isoDay = date.toISOString().slice(0, 10);
    return {
      isoDay,
      label: weekdayLabels[index],
      dayOfMonth: date.getDate(),
      completed: reviewedDays.has(isoDay),
      isToday: isoDay === new Date(today.setHours(0, 0, 0, 0)).toISOString().slice(0, 10)
    };
  });
}

export async function AppShell({
  children,
  activePath,
  userEmail,
  locale,
  railContent,
}: {
  children: ReactNode;
  activePath: Route;
  userEmail?: string;
  locale: AppLocale;
  railContent?: ReactNode;
}) {
  const sessionId = await getSessionIdFromHeaders();
  const cookieStore = await cookies();
  const [currentUser, state, reviewPlan] = await Promise.all([getCurrentUser(), readState(sessionId), getTodayReviewPlan(sessionId)]);
  const copy = getLocaleCopy(locale);
  const avatarCookie = resolveAvatarCookie(cookieStore.get(APP_AVATAR_COOKIE)?.value);
  const avatarUrl =
    avatarCookie
      ? avatarCookie
      : typeof currentUser?.user_metadata?.avatar_url === "string"
      ? currentUser.user_metadata.avatar_url
      : "/default-profile-avatar.svg";
  const isProfileSection = activePath === "/profile" || activePath.startsWith("/profile/");
  const weeklyActivity = buildWeeklyActivity(
    state.reviewLogs.map((log) => log.reviewedAt),
    locale,
  );
  const stats = deriveStats(state);
  const retentionScore = deriveRetentionScore(state);
  const activeGoal = state.profile ? getActiveLearningGoal(state.profile) : undefined;
  const reviewDebt = reviewPlan.counts.must + reviewPlan.counts.should;
  const nextActionLabel =
    reviewPlan.nextBestAction === "review"
      ? locale === "zh-TW" ? "先完成正式複習" : "Clear formal review"
      : reviewPlan.nextBestAction === "reinforce"
        ? locale === "zh-TW" ? "安排弱項補強" : "Reinforce weak spots"
        : locale === "zh-TW" ? "開啟今日新課" : "Open today's lesson";
  const allLinks: Array<{ href: Route; label: string }> = [
    { href: "/dashboard", label: copy.appShell.nav.dashboard },
    { href: "/ai", label: copy.appShell.nav.ai },
    { href: "/classes", label: locale === "zh-TW" ? "班級" : "Classes" },
    { href: "/study/today", label: copy.appShell.nav.today },
    { href: "/study/review", label: copy.appShell.nav.review },
    { href: "/progress", label: copy.appShell.nav.progress },
    { href: "/profile", label: copy.appShell.nav.profile }
  ];
  const childModeAllowedPaths = new Set<Route>(["/study/today", "/study/review", "/progress"]);
  const links = state.accountMode === "child" ? allLinks.filter((link) => childModeAllowedPaths.has(link.href)) : allLinks;
  const quickLinks: Array<{ href: Route; label: string }> = isProfileSection
    ? [
        { href: "/profile", label: copy.profilePage.navOverview },
        { href: "/profile/learners", label: locale === "zh-TW" ? "學習者" : "Learners" },
        { href: "/profile/goals", label: copy.profilePage.navGoals },
        { href: "/profile/ai-settings", label: copy.profilePage.navAiSettings },
        { href: "/profile/settings", label: copy.profilePage.navSettings }
      ]
    : [
        { href: "/ai", label: copy.appShell.nav.ai },
        { href: "/study/today", label: copy.appShell.nav.today },
        { href: "/progress", label: copy.appShell.nav.progress },
        { href: "/profile", label: copy.appShell.nav.profile }
      ];

  if (!state.onboarded && activePath !== "/profile/goals") {
    redirect(`/profile/goals?next=${encodeURIComponent(activePath)}`);
  }

  const learningOnlyAllowed = activePath === "/study/today" || activePath === "/study/review" || activePath === "/progress";
  if (state.accountMode === "child" && !learningOnlyAllowed) {
    redirect("/study/today");
  }

  return (
    <div className="app-shell shell">
      <SiteTopbar
        currentPath={activePath}
        accountMode={state.accountMode}
        activeLearnerId={state.activeLearnerId}
        dueCount={stats.dueCount}
        hasSupervisorPin={Boolean(state.supervisorPinHash)}
        learners={state.learners ?? []}
        locale={locale}
        retentionScore={retentionScore}
        streak={state.streak}
        weeklyActivity={weeklyActivity}
        userAvatarUrl={avatarUrl}
        userEmail={userEmail ?? currentUser?.email ?? undefined}
      />
      <div className="app-grid">
        <aside className="sidebar">
          <div className="eyebrow">{copy.appShell.learningLoop}</div>
          <div className="sidebar-mission">
            <div>
              <div className="sidebar-mission-label">{locale === "zh-TW" ? "下一步" : "Next"}</div>
              <strong>{nextActionLabel}</strong>
            </div>
            <div className="sidebar-mission-grid">
              <div>
                <span>{reviewDebt}</span>
                <small>{locale === "zh-TW" ? "待複習" : "reviews"}</small>
              </div>
              <div>
                <span>{reviewPlan.memoryHealth}</span>
                <small>{locale === "zh-TW" ? "記憶" : "memory"}</small>
              </div>
            </div>
            {activeGoal ? (
              <p>
                {activeGoal.title} · {learningDomainLabel(activeGoal.domain, locale)}
              </p>
            ) : null}
          </div>
          <nav>
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                data-active={link.href === "/profile" ? isProfileSection : activePath === link.href}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="content-panel app-main">{children}</main>
        <aside className="app-rail">
          {railContent ?? (
            <>
              <div className="content-panel rail-panel">
                <div className="eyebrow">{isProfileSection ? copy.profilePage.railEyebrow : copy.appShell.myLearning}</div>
                <h2 className="section-title">
                  {isProfileSection ? copy.appShell.nav.profile : links.find((link) => link.href === activePath)?.label ?? copy.appShell.learningLoop}
                </h2>
                <p className="subtle">{isProfileSection ? copy.profilePage.railBody : userEmail ?? copy.appShell.tagline}</p>
              </div>
              <div className="content-panel rail-panel">
                <div className="eyebrow">{isProfileSection ? copy.profilePage.railNavEyebrow : copy.appShell.learningLoop}</div>
                <nav className="rail-links">
                  {quickLinks.map((link) => (
                    <Link key={link.href} href={link.href} data-active={activePath === link.href}>
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
