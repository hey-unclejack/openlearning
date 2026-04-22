import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { getTodayLesson, getDueReviewItems } from "@/lib/store";
import { getCurrentUser, getSessionIdFromHeaders } from "@/lib/session";

export default async function TodayPage() {
  const sessionId = await getSessionIdFromHeaders();
  const user = await getCurrentUser();
  const dueItems = await getDueReviewItems(sessionId);
  const { lesson, planDay } = await getTodayLesson(sessionId);

  return (
    <AppShell activePath="/study/today" userEmail={user?.email}>
      <section className="stack">
        <div className="panel-header">
          <div>
            <div className="eyebrow">Today</div>
            <h1 className="page-title">One review block. One lesson. Done.</h1>
          </div>
        </div>
        <div className="lesson-grid">
          <div className="review-card">
            <div className="eyebrow">Step 1</div>
            <h2 className="section-title">Clear due reviews</h2>
            <p className="subtle">今天有 {dueItems.length} 張卡片到期。先做這批，才能讓記憶曲線回穩。</p>
            <div className="button-row">
              <Link className="button" href="/study/review">
                Start review
              </Link>
            </div>
          </div>
          <div className="review-card">
            <div className="eyebrow">Step 2</div>
            <h2 className="section-title">{planDay.title}</h2>
            <p className="subtle">{lesson.intro}</p>
            <div className="button-row">
              <Link className="button-secondary" href={`/study/lesson/${lesson.id}`}>
                Open lesson
              </Link>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
