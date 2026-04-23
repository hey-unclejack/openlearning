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
              const payload = (await response.json()) as {
                ok?: boolean;
                error?: string;
                nextLessonId?: string;
                completedLessonId?: string;
                completedLessonTitle?: string;
                completedUnitTitle?: string;
                unitCompleted?: boolean;
              };
              if (!response.ok || !payload.ok) {
                throw new Error(payload.error || copy.lesson.completeError);
              }

              const nextUrl = new URL("/study/today", window.location.origin);
              if (payload.completedLessonTitle) {
                nextUrl.searchParams.set("completedLesson", payload.completedLessonTitle);
              }
              if (payload.completedLessonId) {
                nextUrl.searchParams.set("completedLessonId", payload.completedLessonId);
              }
              if (payload.completedUnitTitle) {
                nextUrl.searchParams.set("completedUnit", payload.completedUnitTitle);
              }
              if (payload.nextLessonId) {
                nextUrl.searchParams.set("nextLessonId", payload.nextLessonId);
              }
              if (payload.unitCompleted) {
                nextUrl.searchParams.set("unitCompleted", "1");
              }

              startTransition(() => {
                router.push(`${nextUrl.pathname}${nextUrl.search}`);
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
