import { AuthDialog } from "@/components/auth/auth-dialog";
import { SiteTopbar } from "@/components/layout/site-topbar";
import { getLocaleCopy } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function MarketingPage({
  searchParams
}: {
  searchParams: Promise<{ auth?: "login" | "signup"; next?: string }>;
}) {
  const locale = await getLocale();
  const user = await getCurrentUser();
  const { auth, next } = await searchParams;
  const copy = getLocaleCopy(locale);
  const isLoggedIn = Boolean(user);
  const authMode = auth === "login" || auth === "signup" ? auth : undefined;
  const nextPath = next?.startsWith("/") ? next : "/study/today";

  return (
    <main className="shell">
      <SiteTopbar authModal currentPath="/" locale={locale} userEmail={user?.email} />

      <section className="hero">
        <div className="hero-copy">
          <div>
            <div className="eyebrow">{copy.marketing.eyebrow}</div>
            <h1>{copy.marketing.title}</h1>
            <p>{copy.marketing.description}</p>
          </div>
        </div>

        <div className="hero-visual">
          <div className="visual-stack steps-layout">
            <div className="glass-panel steps-panel">
              <h3 className="section-title">{copy.marketing.stepsTitle}</h3>
              <div className="steps-list">
                {copy.marketing.steps.map((step) => (
                  <div key={step.title} className="steps-item">
                    <div className="steps-item-number">{step.step}</div>
                    <div className="steps-item-copy">
                      <h4>{step.title}</h4>
                      <p className="subtle">{step.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      {!isLoggedIn ? <AuthDialog initialMode={authMode} locale={locale} nextPath={nextPath} /> : null}
    </main>
  );
}
