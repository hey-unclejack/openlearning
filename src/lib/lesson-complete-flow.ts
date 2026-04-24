export type LessonCompletePayload = {
  ok?: boolean;
  error?: string;
  nextLessonId?: string;
  diagnosticLessonId?: string;
  completedLessonId?: string;
  completedLessonTitle?: string;
  completedUnitTitle?: string;
  unitCompleted?: boolean;
};

export function resolveLessonCompletionRedirect(
  payload: LessonCompletePayload,
  origin = "http://localhost",
) {
  if (payload.diagnosticLessonId) {
    return `/study/diagnostic/${payload.diagnosticLessonId}`;
  }

  const nextUrl = new URL("/study/today", origin);

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

  return `${nextUrl.pathname}${nextUrl.search}`;
}
