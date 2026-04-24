import type { Route } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ReactNode } from "react";
import { AppLocale, getLocaleCopy } from "@/lib/i18n";
import { SiteTopbar } from "@/components/layout/site-topbar";
import { APP_AVATAR_COOKIE, getCurrentUser, getSessionIdFromHeaders, resolveAvatarCookie } from "@/lib/session";
import { readState } from "@/lib/store";

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
  locale
}: {
  children: ReactNode;
  activePath: Route;
  userEmail?: string;
  locale: AppLocale;
}) {
  const sessionId = await getSessionIdFromHeaders();
  const cookieStore = await cookies();
  const [currentUser, state] = await Promise.all([getCurrentUser(), readState(sessionId)]);
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
  const links: Array<{ href: Route; label: string }> = [
    { href: "/dashboard", label: copy.appShell.nav.dashboard },
    { href: "/ai", label: copy.appShell.nav.ai },
    { href: "/study/today", label: copy.appShell.nav.today },
    { href: "/study/review", label: copy.appShell.nav.review },
    { href: "/progress", label: copy.appShell.nav.progress },
    { href: "/profile", label: copy.appShell.nav.profile }
  ];
  const quickLinks: Array<{ href: Route; label: string }> = isProfileSection
    ? [
        { href: "/profile", label: copy.profilePage.navOverview },
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

  return (
    <div className="app-shell shell">
      <SiteTopbar
        currentPath={activePath}
        locale={locale}
        streak={state.streak}
        weeklyActivity={weeklyActivity}
        userAvatarUrl={avatarUrl}
        userEmail={userEmail ?? currentUser?.email ?? undefined}
      />
      <div className="app-grid">
        <aside className="sidebar">
          <div className="eyebrow">{copy.appShell.learningLoop}</div>
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
        </aside>
      </div>
    </div>
  );
}
