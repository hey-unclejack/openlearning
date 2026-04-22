import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { ReviewTrainer } from "@/components/study/review-trainer";
import { getDueReviewItems } from "@/lib/store";
import { getCurrentUser, getSessionIdFromHeaders } from "@/lib/session";

export default async function ReviewPage() {
  const sessionId = await getSessionIdFromHeaders();
  const user = await getCurrentUser();
  const items = await getDueReviewItems(sessionId);

  return (
    <AppShell activePath="/study/review" userEmail={user?.email}>
      <section className="stack">
        <div className="panel-header">
          <div>
            <div className="eyebrow">SRS Review</div>
            <h1 className="page-title">Review at the edge of forgetting.</h1>
            <p className="lede">這裡的體驗刻意簡單。先回想，再翻答案，再用四級評分更新間隔。</p>
          </div>
          <Link className="button-secondary" href="/study/today">
            Back to today
          </Link>
        </div>
        <ReviewTrainer initialItems={items} />
      </section>
    </AppShell>
  );
}
