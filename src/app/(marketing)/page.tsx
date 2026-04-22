import Link from "next/link";
import { getDashboardSnapshot } from "@/lib/content";
import { getSessionIdFromHeaders } from "@/lib/session";

export default async function MarketingPage() {
  const sessionId = await getSessionIdFromHeaders();
  const snapshot = await getDashboardSnapshot(sessionId);

  return (
    <main className="shell">
      <header className="site-header">
        <div className="topbar">
          <div className="brand">
            <span className="brand-mark" />
            OpenLearning
          </div>
          <div className="nav-links">
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/study/today">Today</Link>
            <Link href="/onboarding">Setup</Link>
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div>
            <div className="eyebrow">Language Retention Engine</div>
            <h1>Learn less. Remember more.</h1>
            <p>
              OpenLearning combines spaced repetition, active recall, and short scene-based lessons into a daily loop
              that tells the learner exactly what to review, what to learn next, and where they are still weak.
            </p>
            <div className="cta-row">
              <Link className="button" href="/dashboard">
                Open the app
              </Link>
              <Link className="button-secondary" href="/onboarding">
                Tune the learner profile
              </Link>
            </div>
          </div>
          <div className="feature-grid">
            <div>
              <div className="pill">SRS-first queue</div>
              <p className="subtle">Due reviews come first. New lessons wait until memory is serviced.</p>
            </div>
            <div>
              <div className="pill">Scene-based lessons</div>
              <p className="subtle">Travel, hotel, and restaurant scenarios are taught as usable chunks.</p>
            </div>
            <div>
              <div className="pill">Fast feedback</div>
              <p className="subtle">The app checks output and explains the correction instead of only showing answers.</p>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="visual-stack">
            <div className="glass-panel">
              <div className="eyebrow">Today</div>
              <h3 className="section-title">{snapshot.planDay.title}</h3>
              <p className="subtle">{snapshot.planDay.objective}</p>
            </div>
            <div className="glass-panel" style={{ alignSelf: "center", maxWidth: "72%", justifySelf: "end" }}>
              <h3 className="section-title" style={{ fontSize: "2.1rem" }}>
                {snapshot.stats.dueCount}
              </h3>
              <p className="subtle">cards due right now</p>
              <div className="pill">retention score {snapshot.retentionScore}%</div>
            </div>
            <div className="glass-panel">
              <div className="metric-grid">
                <div>
                  <div className="metric-label subtle">Current streak</div>
                  <div className="metric-value">{snapshot.stats.streak}d</div>
                </div>
                <div>
                  <div className="metric-label subtle">Mastered</div>
                  <div className="metric-value">{snapshot.stats.masteredCount}</div>
                </div>
                <div>
                  <div className="metric-label subtle">Focus</div>
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
