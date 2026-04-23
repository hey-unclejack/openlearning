"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ToastNotice } from "@/components/ui/toast-notice";
import { AppLocale, getLocaleCopy } from "@/lib/i18n";

export function LessonCompleteButton({ lessonId, locale }: { lessonId: string; locale: AppLocale }) {
  const router = useRouter();
  const copy = getLocaleCopy(locale);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <>
      <button
        className="button"
        disabled={isPending || isSubmitting}
        type="button"
        onClick={() => {
          setError(null);
          setIsSubmitting(true);

          fetch("/api/lessons/complete", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ lessonId })
          })
            .then(async (response) => {
              const payload = (await response.json()) as { ok?: boolean; error?: string };
              if (!response.ok || !payload.ok) {
                throw new Error(payload.error || copy.lesson.completeError);
              }

              startTransition(() => {
                router.push("/study/today");
                router.refresh();
              });
            })
            .catch((caught) => {
              setError(caught instanceof Error ? caught.message : copy.lesson.completeError);
            })
            .finally(() => {
              setIsSubmitting(false);
            });
        }}
      >
        {isPending || isSubmitting ? copy.lesson.completingLesson : copy.lesson.completeLesson}
      </button>
      <ToastNotice message={error} tone="error" />
    </>
  );
}
