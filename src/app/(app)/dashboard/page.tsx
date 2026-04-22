import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { getDashboardSnapshot } from "@/lib/content";
import { getCurrentUser, getSessionIdFromHeaders } from "@/lib/session";

export default async function DashboardPage() {
  const sessionId = await getSessionIdFromHeaders();
  const user = await getCurrentUser();
  const snapshot = await getDashboardSnapshot(sessionId);

  return (
    <AppShell activePath="/dashboard" userEmail={user?.email}>
      <section className="stack">
        <div className="panel-header">
          <div>
            <div className="eyebrow">Dashboard</div>
            <h1 className="page-title">Today runs on memory, not motivation.</h1>
          </div>
          <Link className="button" href="/study/today">
            Start today
          </Link>
        </div>

        <div className="dashboard-grid">
          <div className="metric-card">
            <div className="metric-label subtle">Due now</div>
            <div className="metric-value">{snapshot.stats.dueCount}</div>
            <p className="subtle">優先完成這批到期卡片，再進新內容。</p>
          </div>
          <div className="metric-card">
            <div className="metric-label subtle">Retention score</div>
            <div className="metric-value">{snapshot.retentionScore}%</div>
            <p className="subtle">根據複習間隔、答題穩定度與 lapse 估算。</p>
          </div>
          <div className="metric-card">
            <div className="metric-label subtle">Current streak</div>
            <div className="metric-value">{snapshot.stats.streak} days</div>
            <p className="subtle">短任務、高頻率，比一次塞很多更重要。</p>
          </div>
        </div>

        <div className="lesson-grid">
          <div className="review-card">
            <div className="eyebrow">Current lesson</div>
            <h2 className="section-title">{snapshot.planDay.title}</h2>
            <p className="subtle">{snapshot.planDay.objective}</p>
            <div className="button-row">
              <Link className="button-secondary" href={`/study/lesson/lesson-${snapshot.planDay.id}`}>
                Open lesson
              </Link>
            </div>
          </div>
          <div className="review-card">
            <div className="eyebrow">Weak spots</div>
            <ul className="list">
              {snapshot.stats.weakItems.map((item) => (
                <li key={item.id}>
                  <strong>{item.back}</strong>
                  <div className="subtle">lapses {item.lapseCount}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="review-card">
          <div className="eyebrow">Recent review activity</div>
          <ul className="list">
            {snapshot.recentLogs.length === 0 ? (
              <li className="subtle">還沒有 review log。先去完成今天的複習。</li>
            ) : (
              snapshot.recentLogs.map((log) => (
                <li key={`${log.itemId}-${log.reviewedAt}`}>
                  <strong>{log.grade}</strong>
                  <div className="subtle">next due {new Date(log.nextDueDate).toLocaleDateString()}</div>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>
    </AppShell>
  );
}
