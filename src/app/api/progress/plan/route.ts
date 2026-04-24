import { NextResponse } from "next/server";
import { APP_SESSION_COOKIE } from "@/lib/session";
import {
  appendProgressGeneratedLesson,
  createProgressGeneratedPlan,
  deleteProgressGeneratedLesson,
  jumpToProgressLesson,
  reorderProgressGeneratedLessons,
  updateProgressGeneratedLesson,
} from "@/lib/store";
import { createSupabaseServerClient } from "@/lib/supabase-server";

async function resolveSessionId(request: Request) {
  let sessionId: string | null = null;

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    sessionId = user?.id ?? null;
  }

  return (
    sessionId ??
    request.headers.get("x-openlearning-session-id") ??
    request.headers.get("cookie")?.match(new RegExp(`${APP_SESSION_COOKIE}=([^;]+)`))?.[1] ??
    "local-demo"
  );
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "PROGRESS_PLAN_ERROR";

  if (message === "FORBIDDEN_PROGRESS_PLAN") {
    return NextResponse.json({ ok: false, error: "This learner cannot edit the course plan." }, { status: 403 });
  }

  if (message === "PROGRESS_LESSON_COMPLETED") {
    return NextResponse.json({ ok: false, error: "Completed lessons cannot be changed." }, { status: 409 });
  }

  if (message === "PROGRESS_PLAN_NOT_FOUND" || message === "PROGRESS_LESSON_NOT_FOUND") {
    return NextResponse.json({ ok: false, error: "Course plan item was not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: false, error: "Failed to update the course plan." }, { status: 400 });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    planId?: string;
    title?: string;
    objective?: string;
    mode?: "append" | "replace-fixed";
    replaceFromDayNumber?: number;
  };

  if (!body.title?.trim()) {
    return NextResponse.json({ ok: false, error: "title is required." }, { status: 400 });
  }

  try {
    const sessionId = await resolveSessionId(request);
    if (body.planId) {
      const plan = await appendProgressGeneratedLesson(sessionId, {
        planId: body.planId,
        title: body.title,
        objective: body.objective ?? body.title,
      });

      return NextResponse.json({ ok: true, plan });
    }

    const plan = await createProgressGeneratedPlan(sessionId, {
      title: body.title,
      objective: body.objective ?? body.title,
      mode: body.mode,
      replaceFromDayNumber: body.replaceFromDayNumber,
    });

    return NextResponse.json({ ok: true, plan });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as {
    action?: "update-lesson" | "reorder" | "jump";
    source?: "fixed" | "generated";
    planId?: string;
    lessonId?: string;
    lessonIds?: string[];
    title?: string;
    objective?: string;
  };

  try {
    const sessionId = await resolveSessionId(request);

    if (body.action === "jump") {
      if (!body.lessonId || (body.source !== "fixed" && body.source !== "generated")) {
        return NextResponse.json({ ok: false, error: "source and lessonId are required." }, { status: 400 });
      }

      const result = await jumpToProgressLesson(sessionId, {
        source: body.source,
        planId: body.planId,
        lessonId: body.lessonId,
      });

      return NextResponse.json({ ok: true, ...result });
    }

    if (body.action === "reorder") {
      if (!body.planId || !Array.isArray(body.lessonIds)) {
        return NextResponse.json({ ok: false, error: "planId and lessonIds are required." }, { status: 400 });
      }

      const plan = await reorderProgressGeneratedLessons(sessionId, {
        planId: body.planId,
        lessonIds: body.lessonIds,
      });

      return NextResponse.json({ ok: true, plan });
    }

    if (!body.planId || !body.lessonId || !body.title?.trim()) {
      return NextResponse.json({ ok: false, error: "planId, lessonId, and title are required." }, { status: 400 });
    }

    const plan = await updateProgressGeneratedLesson(sessionId, {
      planId: body.planId,
      lessonId: body.lessonId,
      title: body.title,
      objective: body.objective ?? body.title,
    });

    return NextResponse.json({ ok: true, plan });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const planId = url.searchParams.get("planId");
  const lessonId = url.searchParams.get("lessonId");

  if (!planId || !lessonId) {
    return NextResponse.json({ ok: false, error: "planId and lessonId are required." }, { status: 400 });
  }

  try {
    const sessionId = await resolveSessionId(request);
    await deleteProgressGeneratedLesson(sessionId, { planId, lessonId });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
