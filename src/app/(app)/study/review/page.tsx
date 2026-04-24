import { ReviewTrainer } from "@/components/study/review-trainer";
import { getLocale } from "@/lib/i18n-server";
import { getWeakLearningTypes } from "@/lib/practice-performance";
import { getTodayReviewPlan } from "@/lib/store";
import { getLearningPerformanceFromHeaders, getSessionIdFromHeaders } from "@/lib/session";

export default async function ReviewPage() {
  const sessionId = await getSessionIdFromHeaders();
  const learningPerformance = await getLearningPerformanceFromHeaders();
  const reviewPlan = await getTodayReviewPlan(sessionId);
  const items = reviewPlan.picked;
  const locale = await getLocale();
  const weakTypes = getWeakLearningTypes(learningPerformance).slice(0, 2);

  return (
    <ReviewTrainer
      initialItems={items}
      locale={locale}
      weakTypes={weakTypes}
      buckets={{
        mustIds: reviewPlan.must.items.map((item) => item.id),
        shouldIds: reviewPlan.should.items.map((item) => item.id),
        canIds: reviewPlan.can.items.map((item) => item.id)
      }}
    />
  );
}
