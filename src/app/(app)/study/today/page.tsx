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
      <section className="stack today-page">
        <div className="panel-header">
          <div>
            <div className="eyebrow">{copy.todayPage.eyebrow}</div>
            <h1 className="page-title">{copy.todayPage.title}</h1>
          </div>
        </div>
        <div className="lesson-grid today-flow-grid">
          <div className="review-card today-step-card">
            <div className="today-step-head">
              <div className="eyebrow">{copy.todayPage.step1}</div>
              <span className="pill">{copy.todayPage.reviewPill}</span>
            </div>
            <h2 className="section-title">{copy.todayPage.clearReviews}</h2>
            <p className="subtle">{copy.todayPage.dueMessage(dueItems.length)}</p>
            <div className="button-row">
              <Link className="button" href="/study/review">
                {copy.todayPage.startReview}
              </Link>
            </div>
          </div>
          <div className="review-card today-step-card today-step-card-lesson">
            <div className="today-step-head">
              <div className="eyebrow">{copy.todayPage.step2}</div>
              <span className="pill lesson-meta-pill-secondary">{copy.todayPage.lessonPill}</span>
            </div>
            <div className="today-lesson-meta">
              <span className="pill">{copy.todayPage.dayLabel(planDay.dayNumber)}</span>
              <p className="subtle">{copy.todayPage.unitLabel(planDay.unitNumber, planDay.unitTitle)}</p>
            </div>
            <h2 className="section-title">{lesson.id ? planDay.title : copy.todayPage.noLesson}</h2>
            <p className="subtle">{planDay.objective}</p>
            <div className="muted-box today-lesson-note">
              <div className="eyebrow">{copy.todayPage.beforeBegin}</div>
              <p className="subtle">{lesson.intro}</p>
            </div>
            <div className="button-row">
              <Link className="button-secondary" href={`/study/lesson/${planDay.lessonId}`}>
                {copy.todayPage.openLesson}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
