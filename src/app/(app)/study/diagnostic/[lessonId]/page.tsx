import { notFound } from "next/navigation";
import { ReviewTrainer } from "@/components/study/review-trainer";
import { getLocaleCopy } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { getDiagnosticReviewItems, getGeneratedLessonContext, readState } from "@/lib/store";
import { getSessionIdFromHeaders } from "@/lib/session";

export default async function DiagnosticPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const sessionId = await getSessionIdFromHeaders();
  const state = await readState(sessionId);
  const locale = await getLocale();
  const copy = getLocaleCopy(locale);
  const items = await getDiagnosticReviewItems(sessionId, lessonId);
  const weakTypes = items.map((item) => item.learningType).slice(0, 2);
  const generatedContext = await getGeneratedLessonContext(sessionId, lessonId);
  const lessonTitle = state.plan.find((item) => item.lessonId === lessonId)?.title ?? generatedContext?.day.title;
  const exitHref = generatedContext?.nextDay
    ? `/study/generated/${generatedContext.plan.id}/${generatedContext.nextDay.lessonId}`
    : generatedContext
      ? "/ai"
      : "/study/today";
  const exitLabel = generatedContext?.nextDay
    ? locale === "zh-TW"
      ? "前往下一個 AI 課程"
      : "Continue next AI lesson"
    : generatedContext
      ? locale === "zh-TW"
        ? "回到 AI 計劃"
        : "Back to AI plan"
      : copy.reviewPage.returnToToday;

  if (!lessonTitle || items.length === 0) {
    notFound();
  }

  return (
    <ReviewTrainer
      initialItems={items}
      locale={locale}
      weakTypes={weakTypes}
      sessionType="diagnostic"
      exitHref={exitHref}
      exitLabel={exitLabel}
      eyebrow={copy.reviewPage.diagnosticEyebrow}
      title={copy.reviewPage.diagnosticTitle(lessonTitle)}
      description={copy.reviewPage.diagnosticBody}
      doneTitle={copy.reviewPage.diagnosticDoneTitle}
      doneBody={copy.reviewPage.diagnosticDoneBody}
    />
  );
}
