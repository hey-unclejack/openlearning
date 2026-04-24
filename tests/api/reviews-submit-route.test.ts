import test from "node:test";
import assert from "node:assert/strict";
import { POST } from "@/app/api/reviews/submit/route";
import { APP_PERFORMANCE_COOKIE } from "@/lib/practice-performance";
import { APP_SESSION_COOKIE } from "@/lib/session";
import { completeLesson, getDiagnosticReviewItems } from "@/lib/store";

function buildSessionId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

test("reviews submit route updates performance cookie from review result", async () => {
  const sessionId = buildSessionId("review-route");
  await completeLesson(sessionId, "unit-self-intro-lesson-1");
  const [item] = await getDiagnosticReviewItems(sessionId, "unit-self-intro-lesson-1");
  assert.ok(item);

  const request = new Request("http://localhost/api/reviews/submit", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: `${APP_SESSION_COOKIE}=${sessionId}; ${APP_PERFORMANCE_COOKIE}=${encodeURIComponent(
        JSON.stringify({})
      )}`,
    },
    body: JSON.stringify({
      itemId: item.id,
      grade: "good",
      sessionType: "formal",
      confidence: 0.8,
      responseMs: 900,
    }),
  });

  const response = await POST(request);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.schedule.state, "Review");
  assert.ok(body.schedule.scheduledDays > 0);

  const setCookie = response.headers.get("set-cookie");
  assert.ok(setCookie);
  assert.match(setCookie, new RegExp(`${APP_PERFORMANCE_COOKIE}=`));
  assert.match(setCookie, /translation|vocabulary|grammar/);
});
