import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteTopbar } from "@/components/layout/site-topbar";
import { JoinClassForm } from "@/components/classes/join-class-form";
import { getLocale } from "@/lib/i18n-server";
import { getCurrentUser, getSessionIdFromHeaders } from "@/lib/session";
import { findClassInvite, readState } from "@/lib/store";
import { gradeBandLabel, subjectDisplayLabel } from "@/lib/learning-goals";

export const dynamic = "force-dynamic";

export default async function JoinClassPage({
  params
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const [locale, user, sessionId] = await Promise.all([getLocale(), getCurrentUser(), getSessionIdFromHeaders()]);
  const [inviteContext, state] = await Promise.all([findClassInvite(code), readState(sessionId)]);

  if (!inviteContext) {
    notFound();
  }

  const isZh = locale === "zh-TW";
  const nextPath = `/join/class/${code}`;

  return (
    <main className="shell">
      <SiteTopbar currentPath={nextPath} locale={locale} userEmail={user?.email} />
      <section className="stack profile-page-section">
        <div className="panel-header profile-page-header">
          <div>
            <div className="eyebrow">{isZh ? "加入班級" : "Join class"}</div>
            <h1 className="page-title">{inviteContext.classroom.title}</h1>
            <p className="lede">
              {isZh
                ? "家長登入後可為孩子建立獨立學習目標；老師只會看到班級學習摘要。"
                : "Parents can create an isolated child goal. The teacher sees class learning summaries only."}
            </p>
          </div>
          {!user ? (
            <Link className="button" href={`/?auth=signup&next=${encodeURIComponent(nextPath)}`}>
              {isZh ? "登入 / 註冊" : "Sign in / sign up"}
            </Link>
          ) : null}
        </div>
        <div className="lesson-grid">
          <div className="review-card stack">
            <div className="eyebrow">{isZh ? "老師派發的 goal" : "Teacher goal"}</div>
            <h2 className="section-title">{inviteContext.template.title}</h2>
            <div className="goal-summary-strip">
              <span className="goal-summary-chip"><strong>{isZh ? "科目" : "Subject"}</strong>{subjectDisplayLabel(inviteContext.template.subject ?? inviteContext.template.domain, locale)}</span>
              <span className="goal-summary-chip"><strong>{isZh ? "程度" : "Level"}</strong>{inviteContext.template.level}</span>
              <span className="goal-summary-chip"><strong>{isZh ? "每日" : "Daily"}</strong>{inviteContext.template.dailyMinutes} min</span>
              {inviteContext.classroom.gradeBand ? (
                <span className="goal-summary-chip"><strong>{isZh ? "學制" : "Grade"}</strong>{gradeBandLabel(inviteContext.classroom.gradeBand, locale) || inviteContext.classroom.gradeBand}</span>
              ) : null}
            </div>
            <p className="subtle">
              {isZh
                ? "加入後會在孩子檔案底下建立一份獨立 copy，進度、複習與弱點不會和其他孩子混在一起。"
                : "Joining creates an isolated copy under the child profile, so progress, review, and weaknesses stay separate."}
            </p>
          </div>
          <JoinClassForm code={code} learners={state.learners ?? []} locale={locale} />
        </div>
      </section>
    </main>
  );
}
