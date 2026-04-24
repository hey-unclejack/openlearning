"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { EffectiveCourseLesson, ReplanRecommendation } from "@/lib/progress-planning";

type Locale = "zh-TW" | "en";

type ApiResponse = { ok: true } | { ok: false; error: string };

function copy(locale: Locale) {
  const isZh = locale === "zh-TW";

  return {
    allCourses: isZh ? "全部課程內容" : "All course content",
    learnedToggle: isZh ? "查看已學習課程" : "Show learned lessons",
    learnedMore: isZh ? "再顯示 5 筆已學習課程" : "Show 5 more learned lessons",
    learnedHide: isZh ? "收合已學習課程" : "Collapse learned lessons",
    learnedTitle: isZh ? "已學習的課程" : "Learned lessons",
    learnedCount: (shown: number, total: number) => isZh ? `已顯示 ${shown}/${total} 筆` : `${shown}/${total} shown`,
    completedDate: isZh ? "完成日期" : "Completed",
    noCompletedDate: isZh ? "未記錄" : "Not recorded",
    currentCourse: isZh ? "目前課程" : "Current lesson",
    futureCourses: isZh ? "未來課程" : "Future lessons",
    futureCount: (shown: number, total: number) => isZh ? `已顯示 ${shown}/${total} 筆` : `${shown}/${total} shown`,
    expandFuture: isZh ? "展開 5 筆未來課程" : "Show 5 more future lessons",
    collapseFuture: isZh ? "收合已展開未來課程" : "Collapse expanded future lessons",
    readOnly: isZh ? "此學習者隸屬家長/老師或兒童模式，目前只能查看與學習。" : "This learner is managed or in child mode, so the plan is read-only.",
    saving: isZh ? "儲存中..." : "Saving...",
    edit: isZh ? "儲存變更" : "Save changes",
    delete: isZh ? "刪除" : "Delete",
    replan: isZh ? "重新安排" : "Replan",
    moveUp: isZh ? "上移" : "Move up",
    moveDown: isZh ? "下移" : "Move down",
    relearn: isZh ? "重新學習" : "Relearn",
    open: isZh ? "打開" : "Open",
    jump: isZh ? "跳到該課程" : "Jump to this lesson",
    jumpTitle: isZh ? "跳到指定課程" : "Jump to selected lesson",
    jumpBody: isZh
      ? "確認後會直接前往這堂課。中間尚未完成的課程會標記為已跳過，避免干擾完成率與學習評量。"
      : "After confirmation, you will go directly to this lesson. Unfinished lessons in between will be marked as skipped so completion and evaluation stay clean.",
    jumpEffectTitle: isZh ? "跳課影響" : "Jump impact",
    jumpEffectBody: isZh
      ? "已跳過的課程不計入完成數、複習模型與能力評估；後續課程仍可重新安排。"
      : "Skipped lessons will not count toward completion, review modeling, or skill evaluation. Future lessons can still be replanned.",
    targetLesson: isZh ? "目標課程" : "Target lesson",
    confirmJump: isZh ? "確認跳課並前往" : "Confirm and go",
    cancel: isZh ? "取消" : "Cancel",
    locked: isZh ? "已完成，已鎖定" : "Completed and locked",
    completed: isZh ? "已完成" : "Completed",
    current: isZh ? "目前" : "Current",
    upcoming: isZh ? "接下來" : "Upcoming",
    skipped: isZh ? "已跳過" : "Skipped",
    fixed: isZh ? "固定課程" : "Fixed",
    generated: isZh ? "自訂 / AI" : "Custom / AI",
    recommendations: isZh ? "系統重新安排建議" : "System replan recommendations",
    noCourses: isZh ? "目前尚未建立課程。可以用右側 AI 功能生成一組課程。" : "No courses exist yet. Generate a plan with AI from the right rail.",
  };
}

async function parseResponse(response: Response): Promise<ApiResponse> {
  const payload = (await response.json()) as ApiResponse;
  return payload;
}

export function ProgressCourseManager({
  canManage,
  lessons,
  locale,
  recommendations,
  showRecommendations = true,
}: {
  canManage: boolean;
  lessons: EffectiveCourseLesson[];
  locale: Locale;
  recommendations: ReplanRecommendation[];
  showRecommendations?: boolean;
}) {
  const text = copy(locale);
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editObjective, setEditObjective] = useState("");
  const [learnedVisibleCount, setLearnedVisibleCount] = useState(0);
  const [futureVisibleCount, setFutureVisibleCount] = useState(4);
  const [jumpLesson, setJumpLesson] = useState<EffectiveCourseLesson | null>(null);
  const futureRefs = useRef<Record<string, HTMLElement | null>>({});
  const futureSectionRef = useRef<HTMLElement | null>(null);
  const learnedLessons = lessons.filter((lesson) => lesson.status === "completed");
  const visibleLearnedLessons = learnedLessons.slice(0, learnedVisibleCount);
  const currentLesson = lessons.find((lesson) => lesson.status === "current");
  const futureLessons = lessons.filter((lesson) => lesson.status === "upcoming");
  const visibleFutureLessons = futureLessons.slice(0, futureVisibleCount);

  async function updateLesson(lesson: EffectiveCourseLesson) {
    if (!lesson.planId) {
      return;
    }

    setPending(true);
    setError(null);
    const response = await fetch("/api/progress/plan", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update-lesson",
        planId: lesson.planId,
        lessonId: lesson.lessonId,
        title: editTitle,
        objective: editObjective || editTitle,
      }),
    });
    const payload = await parseResponse(response);
    setPending(false);

    if (!payload.ok) {
      setError(payload.error);
      return;
    }

    setEditingKey(null);
    router.refresh();
  }

  async function deleteLesson(lesson: EffectiveCourseLesson) {
    if (!lesson.planId) {
      return;
    }

    setPending(true);
    setError(null);
    const response = await fetch(`/api/progress/plan?planId=${encodeURIComponent(lesson.planId)}&lessonId=${encodeURIComponent(lesson.lessonId)}`, {
      method: "DELETE",
    });
    const payload = await parseResponse(response);
    setPending(false);

    if (!payload.ok) {
      setError(payload.error);
      return;
    }

    router.refresh();
  }

  async function moveLesson(lesson: EffectiveCourseLesson, direction: -1 | 1) {
    if (!lesson.planId) {
      return;
    }

    const samePlanUpcoming = lessons.filter(
      (item) => item.planId === lesson.planId && item.source === "generated" && !item.locked,
    );
    const currentIndex = samePlanUpcoming.findIndex((item) => item.lessonId === lesson.lessonId);
    const nextIndex = currentIndex + direction;

    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= samePlanUpcoming.length) {
      return;
    }

    const reordered = [...samePlanUpcoming];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(nextIndex, 0, moved);

    setPending(true);
    setError(null);
    const response = await fetch("/api/progress/plan", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "reorder",
        planId: lesson.planId,
        lessonIds: reordered.map((item) => item.lessonId),
      }),
    });
    const payload = await parseResponse(response);
    setPending(false);

    if (!payload.ok) {
      setError(payload.error);
      return;
    }

    router.refresh();
  }

  function expandFuture() {
    const nextFirst = futureLessons[futureVisibleCount];

    setFutureVisibleCount((current) => current + 5);

    if (nextFirst) {
      window.setTimeout(() => {
        futureRefs.current[nextFirst.key]?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    }
  }

  function collapseFuture() {
    setFutureVisibleCount(4);
    window.setTimeout(() => {
      futureSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  function formatCompletedDate(value?: string) {
    if (!value) {
      return text.noCompletedDate;
    }

    try {
      return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(value));
    } catch {
      return value.slice(0, 10);
    }
  }

  async function confirmJump() {
    if (!jumpLesson) {
      return;
    }

    setPending(true);
    setError(null);
    const response = await fetch("/api/progress/plan", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "jump",
        source: jumpLesson.source,
        planId: jumpLesson.planId,
        lessonId: jumpLesson.lessonId,
      }),
    });
    const payload = (await response.json()) as ({ ok: true; href: string } | { ok: false; error: string });
    setPending(false);

    if (!payload.ok) {
      setError(payload.error);
      return;
    }

    window.location.href = payload.href;
  }

  function LessonCard({
    lesson,
    tone,
    showOpen = false,
    showJump = false,
  }: {
    lesson: EffectiveCourseLesson;
    tone: "learned" | "current" | "future";
    showOpen?: boolean;
    showJump?: boolean;
  }) {
    const isEditing = editingKey === lesson.key;
    const samePlanUpcoming = lesson.planId
      ? lessons.filter((item) => item.planId === lesson.planId && item.source === "generated" && !item.locked)
      : [];
    const samePlanIndex = samePlanUpcoming.findIndex((item) => item.lessonId === lesson.lessonId);

    return (
      <article
        className={`progress-course-card ${tone}${lesson.status === "skipped" ? " skipped" : ""}`}
        ref={(element) => {
          futureRefs.current[lesson.key] = element;
        }}
      >
        <div className="progress-course-card-head">
          <span className="pill">{`Day ${lesson.dayNumber}`}</span>
          <span className="progress-lesson-state">
            {lesson.source === "fixed" ? text.fixed : text.generated}
            {" · "}
            {lesson.status === "completed" ? text.completed : lesson.status === "current" ? text.current : lesson.status === "skipped" ? text.skipped : text.upcoming}
          </span>
        </div>
        {tone === "learned" ? (
          <div className="progress-course-date">
            {text.completedDate}: {formatCompletedDate(lesson.completedAt)}
          </div>
        ) : null}
        <div className="progress-lesson-copy">
          {isEditing ? (
            <div className="progress-inline-edit">
              <input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} />
              <textarea rows={2} value={editObjective} onChange={(event) => setEditObjective(event.target.value)} />
            </div>
          ) : (
            <>
              <strong>{lesson.title}</strong>
              <span className="subtle">{lesson.objective}</span>
            </>
          )}
        </div>
        <div className="button-row progress-action-row">
          {showOpen ? (
            <Link className="button" href={lesson.href}>
              {text.open}
            </Link>
          ) : null}
          {showJump && lesson.canJump ? (
            <button className="button-secondary" onClick={() => setJumpLesson(lesson)} type="button">
              {text.jump}
            </button>
          ) : null}
          {lesson.relearnHref ? (
            <Link className="button-secondary" href={lesson.relearnHref}>
              {text.relearn}
            </Link>
          ) : null}
          {canManage && lesson.source === "generated" && !lesson.locked ? (
            isEditing ? (
              <button className="button" disabled={pending} onClick={() => updateLesson(lesson)} type="button">
                {pending ? text.saving : text.edit}
              </button>
            ) : (
              <button
                className="button-secondary"
                onClick={() => {
                  setEditingKey(lesson.key);
                  setEditTitle(lesson.title);
                  setEditObjective(lesson.objective);
                }}
                type="button"
              >
                {text.replan}
              </button>
            )
          ) : null}
          {canManage && lesson.source === "generated" && !lesson.locked && samePlanUpcoming.length > 1 ? (
            <>
              <button className="button-secondary" disabled={pending || samePlanIndex <= 0} onClick={() => moveLesson(lesson, -1)} type="button">
                {text.moveUp}
              </button>
              <button
                className="button-secondary"
                disabled={pending || samePlanIndex < 0 || samePlanIndex >= samePlanUpcoming.length - 1}
                onClick={() => moveLesson(lesson, 1)}
                type="button"
              >
                {text.moveDown}
              </button>
            </>
          ) : null}
          {canManage && lesson.source === "generated" && !lesson.locked ? (
            <button className="button-secondary" disabled={pending} onClick={() => deleteLesson(lesson)} type="button">
              {text.delete}
            </button>
          ) : null}
        </div>
      </article>
    );
  }

  return (
    <div className="progress-course-manager">
      <div className="button-row progress-top-actions">
        <button
          className="button-secondary"
          disabled={learnedLessons.length === 0 || learnedVisibleCount >= learnedLessons.length}
          onClick={() => setLearnedVisibleCount((current) => Math.min(current + 5, learnedLessons.length))}
          type="button"
        >
          {learnedVisibleCount > 0 ? text.learnedMore : text.learnedToggle}
        </button>
        {learnedVisibleCount > 0 ? (
          <button className="button-secondary" onClick={() => setLearnedVisibleCount(0)} type="button">
            {text.learnedHide}
          </button>
        ) : null}
      </div>

      {learnedVisibleCount > 0 ? (
        <section className="review-card progress-map-card">
          <div className="progress-section-head">
            <div className="eyebrow">{text.learnedTitle}</div>
            <span className="progress-section-count">{text.learnedCount(visibleLearnedLessons.length, learnedLessons.length)}</span>
          </div>
          <div className="progress-course-list">
            {learnedLessons.length === 0 ? <p className="subtle">{text.noCourses}</p> : null}
            {visibleLearnedLessons.map((lesson) => <LessonCard key={lesson.key} lesson={lesson} tone="learned" />)}
          </div>
        </section>
      ) : null}

      <section className="review-card progress-current-card">
        <div className="eyebrow">{text.currentCourse}</div>
        {currentLesson ? <LessonCard lesson={currentLesson} showOpen tone="current" /> : <p className="subtle">{text.noCourses}</p>}
      </section>

      <section className="review-card progress-map-card" ref={futureSectionRef}>
        <div className="progress-section-head">
          <div className="eyebrow">{text.futureCourses}</div>
          <span className="progress-section-count">{text.futureCount(visibleFutureLessons.length, futureLessons.length)}</span>
        </div>
        <div className="progress-course-list">
          {visibleFutureLessons.length === 0 ? <p className="subtle">{text.noCourses}</p> : null}
          {visibleFutureLessons.map((lesson) => <LessonCard key={lesson.key} lesson={lesson} showJump tone="future" />)}
        </div>
        {futureVisibleCount < futureLessons.length || futureVisibleCount > 4 ? (
          <div className="button-row progress-future-actions">
            {futureVisibleCount < futureLessons.length ? (
              <button className="button-secondary" onClick={expandFuture} type="button">
                {text.expandFuture}
              </button>
            ) : null}
            {futureVisibleCount > 4 ? (
              <button className="button-secondary" onClick={collapseFuture} type="button">
                {text.collapseFuture}
              </button>
            ) : null}
          </div>
        ) : null}
      </section>

      {showRecommendations ? (
        <section className="review-card progress-weak-card">
          <div className="eyebrow">{text.recommendations}</div>
          <div className="progress-recommendation-list">
            {recommendations.map((recommendation) => (
              <article className="muted-box progress-recommendation-card" key={recommendation.kind}>
                <strong>{recommendation.title}</strong>
                <p className="subtle">{recommendation.body}</p>
                {recommendation.href ? (
                  <Link className="button-secondary" href={recommendation.href}>
                    {recommendation.actionLabel}
                  </Link>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {jumpLesson ? (
        <div className="progress-modal-backdrop" role="presentation">
          <div aria-modal="true" className="progress-modal" role="dialog">
            <div>
              <div className="eyebrow">{text.jumpTitle}</div>
              <h3 className="section-title">{jumpLesson.title}</h3>
              <p className="subtle">{text.jumpBody}</p>
            </div>
            <div className="progress-modal-summary">
              <div>
                <span className="subtle">{text.targetLesson}</span>
                <strong>{`Day ${jumpLesson.dayNumber} · ${jumpLesson.source === "fixed" ? text.fixed : text.generated}`}</strong>
              </div>
              <div className="progress-modal-warning">
                <strong>{text.jumpEffectTitle}</strong>
                <span>{text.jumpEffectBody}</span>
              </div>
            </div>
            {error ? <div className="toast-inline error">{error}</div> : null}
            <div className="button-row progress-modal-actions">
              <button className="button" disabled={pending} onClick={confirmJump} type="button">
                {pending ? text.saving : text.confirmJump}
              </button>
              <button className="button-secondary" disabled={pending} onClick={() => setJumpLesson(null)} type="button">
                {text.cancel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
