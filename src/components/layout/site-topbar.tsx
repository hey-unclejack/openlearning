import Link from "next/link";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { AppLocale, getLocaleCopy } from "@/lib/i18n";

function StreakIcon() {
  return (
    <svg aria-hidden="true" className="streak-icon" viewBox="0 0 20 20">
      <path
        d="M11.8 1.7c.3 2-.2 3.5-1.6 5-.8.8-1.2 1.6-1.2 2.5 0 .8.3 1.5.9 2.1-.1-1.4.4-2.6 1.7-3.8.8-.8 1.5-1.9 2-3.4 2.1 1.7 3.3 4 3.3 6.4 0 3.9-3 7-7 7s-7-3.1-7-7c0-2.9 1.7-5.4 4.4-6.6-.3 1.5 0 2.8 1 3.9.2-2.6 1.3-4.7 3.5-6.1Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" className="streak-check-icon" viewBox="0 0 16 16">
      <path d="m6.4 11.4-3-3 1.1-1.1 1.9 1.9 5-5 1.1 1.1-6.1 6.1Z" fill="currentColor" />
    </svg>
  );
}

export function SiteTopbar({
  locale,
  userEmail,
  userAvatarUrl,
  streak,
  weeklyActivity,
  currentPath,
  authModal = false
}: {
  locale: AppLocale;
  userEmail?: string;
  userAvatarUrl?: string;
  streak?: number;
  weeklyActivity?: Array<{
    isoDay: string;
    label: string;
    dayOfMonth: number;
    completed: boolean;
    isToday: boolean;
  }>;
  currentPath: string;
  authModal?: boolean;
}) {
  const copy = getLocaleCopy(locale);
  const authHref = authModal ? "/?auth=signup" : "/signup";
  const avatarFallback = userEmail?.trim().charAt(0).toUpperCase() || "O";
  const resolvedAvatarUrl = userAvatarUrl || "/default-profile-avatar.svg";

  return (
    <header className="site-header">
      <div className="topbar">
        <Link className="brand" href="/">
          <span className="brand-mark" />
          OpenLearning
        </Link>
        <div className="topbar-actions">
          {userEmail ? (
            <>
              <div className="streak-hover">
                <div className="streak-pill" aria-label={`${copy.dashboard.currentStreak} ${streak ?? 0}`}>
                  <StreakIcon />
                  <span>{streak ?? 0}</span>
                </div>
                <div className="streak-panel">
                  <div className="streak-panel-copy">
                    <div className="eyebrow">{copy.topbar.streakLabel}</div>
                    <h3>{copy.topbar.streakTitle(streak ?? 0)}</h3>
                  </div>
                  <div className="streak-calendar">
                    {weeklyActivity?.map((day) => (
                      <div key={day.isoDay} className={`streak-day${day.isToday ? " today" : ""}`}>
                        <div className="streak-day-label">{day.label}</div>
                        <div className={`streak-day-box${day.completed ? " completed" : ""}`}>
                          {day.completed ? <CheckIcon /> : <span className="streak-day-number">{day.dayOfMonth}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <Link className="profile-link" href="/profile">
                {resolvedAvatarUrl ? (
                  <img alt={userEmail} className="profile-avatar" src={resolvedAvatarUrl} />
                ) : (
                  <span className="profile-avatar profile-avatar-fallback">{avatarFallback}</span>
                )}
              </Link>
            </>
          ) : (
            <>
              <LanguageSwitcher locale={locale} nextPath={currentPath} />
              <Link className="nav-link-strong" href={authHref}>
                {copy.marketing.authEntry}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
