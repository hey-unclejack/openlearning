import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { getLocaleCopy } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { getTodayLesson, getDueReviewItems } from "@/lib/store";
import { getCurrentUser, getSessionIdFromHeaders } from "@/lib/session";

export default async function TodayPage() {
  const sessionId = await getSessionIdFromHeaders();
  const user = await getCurrentUser();
  const dueItems = await getDueReviewItems(sessionId);
  const { lesson, planDay } = await getTodayLesson(sessionId);
  const locale = await getLocale();
  const copy = getLocaleCopy(locale);

  return (
    <AppShell activePath="/study/today" locale={locale} userEmail={user?.email}>
      <section className="stack">
        <div className="panel-header">
          <div>
            <div className="eyebrow">{copy.todayPage.eyebrow}</div>
            <h1 className="page-title">{copy.todayPage.title}</h1>
          </div>
        </div>
        <div className="lesson-grid">
          <div className="review-card">
            <div className="eyebrow">{copy.todayPage.step1}</div>
            <h2 className="section-title">{copy.todayPage.clearReviews}</h2>
            <p className="subtle">{copy.todayPage.dueMessage(dueItems.length)}</p>
            <div className="button-row">
              <Link className="button" href="/study/review">
                {copy.todayPage.startReview}
              </Link>
            </div>
          </div>
          <div className="review-card">
            <div className="eyebrow">{copy.todayPage.step2}</div>
            <h2 className="section-title">{planDay.title}</h2>
            <p className="subtle">{lesson.intro}</p>
            <div className="button-row">
              <Link className="button-secondary" href={`/study/lesson/${lesson.id}`}>
                {copy.todayPage.openLesson}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
