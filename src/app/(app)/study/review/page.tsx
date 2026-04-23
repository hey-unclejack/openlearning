import { ReviewTrainer } from "@/components/study/review-trainer";
import { getLocale } from "@/lib/i18n-server";
import { getWeakLearningTypes } from "@/lib/practice-performance";
import { getDueReviewItems } from "@/lib/store";
import { getLearningPerformanceFromHeaders, getSessionIdFromHeaders } from "@/lib/session";

export default async function ReviewPage() {
  const sessionId = await getSessionIdFromHeaders();
  const learningPerformance = await getLearningPerformanceFromHeaders();
  const items = await getDueReviewItems(sessionId);
  const locale = await getLocale();
  const weakTypes = getWeakLearningTypes(learningPerformance).slice(0, 2);

  return <ReviewTrainer initialItems={items} locale={locale} weakTypes={weakTypes} />;
}
