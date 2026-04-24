import { ReviewTrainer } from "@/components/study/review-trainer";
import { getLocaleCopy } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { getExtraReviewItems } from "@/lib/store";
import { getSessionIdFromHeaders } from "@/lib/session";

export default async function ExtraReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: "all" | "recent" | "weak" | "lesson"; lessonId?: string }>;
}) {
  const { scope = "all", lessonId } = await searchParams;
  const sessionId = await getSessionIdFromHeaders();
  const locale = await getLocale();
  const copy = getLocaleCopy(locale);
  const items = await getExtraReviewItems(sessionId, scope, lessonId);
  const weakTypes = [...new Set(items.map((item) => item.learningType))].slice(0, 2);

  return (
    <ReviewTrainer
      initialItems={items}
      locale={locale}
      weakTypes={weakTypes}
      sessionType="extra"
      exitHref="/progress"
      exitLabel={copy.progress.backToProgress}
      eyebrow={copy.reviewPage.extraEyebrow}
      title={copy.reviewPage.extraTitle(scope)}
      description={copy.reviewPage.extraBody}
      doneTitle={copy.reviewPage.extraDoneTitle}
      doneBody={copy.reviewPage.extraDoneBody}
    />
  );
}
