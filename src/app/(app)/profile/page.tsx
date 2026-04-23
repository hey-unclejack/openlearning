import { cookies } from "next/headers";
import { AppShell } from "@/components/layout/app-shell";
import { ProfileForm } from "@/components/profile/profile-form";
import { getLocaleCopy } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { APP_AVATAR_COOKIE, getCurrentUser, getSessionIdFromHeaders, resolveAvatarCookie } from "@/lib/session";
import { readState } from "@/lib/store";

export const dynamic = "force-dynamic";

function resolveDisplayName(user: Awaited<ReturnType<typeof getCurrentUser>>) {
  if (!user) {
    return "";
  }

  const fromMetadata =
    typeof user.user_metadata?.display_name === "string"
      ? user.user_metadata.display_name
      : typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : typeof user.user_metadata?.name === "string"
          ? user.user_metadata.name
          : "";

  return fromMetadata || user.email?.split("@")[0] || "";
}

export default async function ProfilePage() {
  const sessionId = await getSessionIdFromHeaders();
  const cookieStore = await cookies();
  const [user, state, locale] = await Promise.all([getCurrentUser(), readState(sessionId), getLocale()]);
  const copy = getLocaleCopy(locale);
  const avatarCookie = resolveAvatarCookie(cookieStore.get(APP_AVATAR_COOKIE)?.value);
  const avatarUrl =
    avatarCookie
      ? avatarCookie
      : typeof user?.user_metadata?.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : "/default-profile-avatar.svg";
  const achievements = [
    {
      label: copy.profilePage.badgeFirstSession,
      current: Math.min(state.reviewLogs.length, 1),
      target: 1,
      unlocked: state.reviewLogs.length >= 1
    },
    {
      label: copy.profilePage.badgeWarmStreak,
      current: Math.min(state.streak, 3),
      target: 3,
      unlocked: state.streak >= 3
    },
    {
      label: copy.profilePage.badgeWeeklyRhythm,
      current: Math.min(state.streak, 7),
      target: 7,
      unlocked: state.streak >= 7
    },
    {
      label: copy.profilePage.badgeReviewBuilder,
      current: Math.min(state.reviewLogs.length, 25),
      target: 25,
      unlocked: state.reviewLogs.length >= 25
    },
    {
      label: copy.profilePage.badgeLessonStarter,
      current: Math.min(state.currentDay, 2),
      target: 2,
      unlocked: state.currentDay >= 2
    },
    {
      label: copy.profilePage.badgeLessonMomentum,
      current: Math.min(state.currentDay, 5),
      target: 5,
      unlocked: state.currentDay >= 5
    }
  ];

  return (
    <AppShell activePath="/profile" locale={locale} userEmail={user?.email}>
      <section className="stack profile-page-section">
        <div className="panel-header profile-page-header">
          <div>
            <div className="eyebrow">{copy.profilePage.eyebrow}</div>
            <h1 className="page-title">{copy.profilePage.title}</h1>
            <p className="lede">{copy.profilePage.body}</p>
          </div>
        </div>
        <div className="profile-page-body">
          <ProfileForm
            achievements={achievements}
            email={user?.email}
            initialAvatarUrl={avatarUrl}
            initialName={resolveDisplayName(user)}
            locale={locale}
            userId={user?.id}
          />
        </div>
      </section>
    </AppShell>
  );
}
