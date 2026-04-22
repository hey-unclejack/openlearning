import Link from "next/link";
import { getLocaleCopy } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { getDashboardSnapshot } from "@/lib/content";
import { getSessionIdFromHeaders } from "@/lib/session";

export default async function MarketingPage() {
  const sessionId = await getSessionIdFromHeaders();
  const snapshot = await getDashboardSnapshot(sessionId);
  const locale = await getLocale();
  const copy = getLocaleCopy(locale);

  return (
    <main className="shell">
      <header className="site-header">
        <div className="topbar">
          <div className="brand">
            <span className="brand-mark" />
            OpenLearning
          </div>
          <div className="nav-links">
            <Link href="/login">{copy.marketing.login}</Link>
            <Link href="/signup">{copy.marketing.signup}</Link>
            <Link href="/dashboard">{copy.marketing.dashboard}</Link>
            <Link href="/study/today">{copy.marketing.todayNav}</Link>
            <Link href="/onboarding">{copy.marketing.setup}</Link>
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div>
            <div className="eyebrow">{copy.marketing.eyebrow}</div>
            <h1>{copy.marketing.title}</h1>
            <p>{copy.marketing.description}</p>
            <div className="cta-row">
              <Link className="button" href="/login">
                {copy.marketing.loginCta}
              </Link>
              <Link className="button-secondary" href="/signup">
                {copy.marketing.signupCta}
              </Link>
              <Link className="button" href="/dashboard">
                {copy.marketing.previewCta}
              </Link>
            </div>
          </div>
          <div className="feature-grid">
            {copy.marketing.features.map((feature) => (
              <div key={feature.title}>
                <div className="pill">{feature.title}</div>
                <p className="subtle">{feature.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="hero-visual">
          <div className="visual-stack">
            <div className="glass-panel">
              <div className="eyebrow">{copy.marketing.todaySection}</div>
              <h3 className="section-title">{snapshot.planDay.title}</h3>
              <p className="subtle">{snapshot.planDay.objective}</p>
            </div>
            <div className="glass-panel" style={{ alignSelf: "center", maxWidth: "72%", justifySelf: "end" }}>
              <h3 className="section-title" style={{ fontSize: "2.1rem" }}>
                {snapshot.stats.dueCount}
              </h3>
              <p className="subtle">{copy.marketing.cardsDue}</p>
              <div className="pill">
                {copy.marketing.retention} {snapshot.retentionScore}%
              </div>
            </div>
            <div className="glass-panel">
              <div className="metric-grid">
                <div>
                  <div className="metric-label subtle">{copy.marketing.currentStreak}</div>
                  <div className="metric-value">{snapshot.stats.streak}d</div>
                </div>
                <div>
                  <div className="metric-label subtle">{copy.marketing.mastered}</div>
                  <div className="metric-value">{snapshot.stats.masteredCount}</div>
                </div>
                <div>
                  <div className="metric-label subtle">{copy.marketing.focus}</div>
                  <div className="metric-value" style={{ fontSize: "1.2rem" }}>
                    {snapshot.profile?.focus}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
