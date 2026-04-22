import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { ReviewTrainer } from "@/components/study/review-trainer";
import { getLocaleCopy } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { getDueReviewItems } from "@/lib/store";
import { getCurrentUser, getSessionIdFromHeaders } from "@/lib/session";

export default async function ReviewPage() {
  const sessionId = await getSessionIdFromHeaders();
  const user = await getCurrentUser();
  const items = await getDueReviewItems(sessionId);
  const locale = await getLocale();
  const copy = getLocaleCopy(locale);

  return (
    <AppShell activePath="/study/review" locale={locale} userEmail={user?.email}>
      <section className="stack">
        <div className="panel-header">
          <div>
            <div className="eyebrow">{copy.reviewPage.eyebrow}</div>
            <h1 className="page-title">{copy.reviewPage.title}</h1>
            <p className="lede">{copy.reviewPage.body}</p>
          </div>
          <Link className="button-secondary" href="/study/today">
            {copy.reviewPage.back}
          </Link>
        </div>
        <ReviewTrainer initialItems={items} locale={locale} />
      </section>
    </AppShell>
  );
}
