import { ReviewTrainer } from "@/components/study/review-trainer";
import { getLocale } from "@/lib/i18n-server";
import { getDueReviewItems } from "@/lib/store";
import { getSessionIdFromHeaders } from "@/lib/session";

export default async function ReviewPage() {
  const sessionId = await getSessionIdFromHeaders();
  const items = await getDueReviewItems(sessionId);
  const locale = await getLocale();

  return <ReviewTrainer initialItems={items} locale={locale} />;
}
