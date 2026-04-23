import { AppShell } from "@/components/layout/app-shell";
import { SettingsForm } from "@/components/profile/settings-form";
import { ToastNotice } from "@/components/ui/toast-notice";
import { getLocaleCopy } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ProfileSettingsPage({
  searchParams
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const [locale, user] = await Promise.all([getLocale(), getCurrentUser()]);
  const copy = getLocaleCopy(locale);
  const { saved } = await searchParams;

  return (
    <AppShell activePath="/profile/settings" locale={locale} userEmail={user?.email}>
      <section className="stack profile-page-section">
        <ToastNotice message={saved === "1" ? copy.settingsPage.saveSuccess : null} tone="success" />
        <div className="panel-header profile-page-header">
          <div>
            <div className="eyebrow">{copy.settingsPage.eyebrow}</div>
            <h1 className="page-title">{copy.settingsPage.title}</h1>
          </div>
        </div>
        <div className="profile-page-body">
          <SettingsForm locale={locale} />
        </div>
      </section>
    </AppShell>
  );
}
