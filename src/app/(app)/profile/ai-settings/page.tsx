import { AppShell } from "@/components/layout/app-shell";
import { AiProviderSettings } from "@/components/ai/ai-provider-settings";
import { getLocaleCopy } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ProfileAiSettingsPage() {
  const [locale, user] = await Promise.all([getLocale(), getCurrentUser()]);
  const copy = getLocaleCopy(locale);

  return (
    <AppShell activePath="/profile/ai-settings" locale={locale} userEmail={user?.email}>
      <section className="stack profile-page-section">
        <div className="panel-header profile-page-header">
          <div>
            <div className="eyebrow">{copy.aiSettingsPage.eyebrow}</div>
            <h1 className="page-title">{copy.aiSettingsPage.title}</h1>
            <p className="lede">{copy.aiSettingsPage.body}</p>
          </div>
        </div>
        <div className="profile-page-body">
          <AiProviderSettings locale={locale} />
        </div>
      </section>
    </AppShell>
  );
}
