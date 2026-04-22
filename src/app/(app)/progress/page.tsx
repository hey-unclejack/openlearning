import { AppShell } from "@/components/layout/app-shell";
import { getDashboardSnapshot } from "@/lib/content";
import { readState } from "@/lib/store";
import { getCurrentUser, getSessionIdFromHeaders } from "@/lib/session";

export default async function ProgressPage() {
  const sessionId = await getSessionIdFromHeaders();
  const user = await getCurrentUser();
  const snapshot = await getDashboardSnapshot(sessionId);
  const state = await readState(sessionId);

  return (
    <AppShell activePath="/progress" userEmail={user?.email}>
      <section className="stack">
        <div className="panel-header">
          <div>
            <div className="eyebrow">Progress</div>
            <h1 className="page-title">Track memory, not just activity.</h1>
          </div>
        </div>

        <div className="progress-grid">
          <div className="metric-card">
            <div className="metric-label subtle">Completed days</div>
            <div className="metric-value">
              {snapshot.stats.completedDays}/{snapshot.stats.planDays}
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-label subtle">Mastered items</div>
            <div className="metric-value">{snapshot.stats.masteredCount}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label subtle">Review attempts</div>
            <div className="metric-value">{snapshot.stats.totalReviews}</div>
          </div>
        </div>

        <div className="lesson-grid">
          <div className="review-card">
            <h3 className="section-title">Plan map</h3>
            <ul className="list">
              {state.plan.map((day) => (
                <li key={day.id}>
                  <strong>
                    Day {day.dayNumber}: {day.title}
                  </strong>
                  <div className="subtle">{day.objective}</div>
                </li>
              ))}
            </ul>
          </div>
          <div className="review-card">
            <h3 className="section-title">Weakness trend</h3>
            <ul className="list">
              {snapshot.stats.weakItems.map((item) => (
                <li key={item.id}>
                  <strong>{item.back}</strong>
                  <div className="subtle">
                    lapses {item.lapseCount}, interval {item.intervalDays} day(s)
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
