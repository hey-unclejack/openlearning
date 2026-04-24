import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { CreateInviteButton, PublishGoalButton, SyncTemplateButton } from "@/components/classes/classroom-actions";
import { getLocale } from "@/lib/i18n-server";
import { subjectDisplayLabel } from "@/lib/learning-goals";
import { getActiveLearnerGoal } from "@/lib/learner-spaces";
import { getCurrentUser, getSessionIdFromHeaders } from "@/lib/session";
import { getClassSummary, readState } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ClassDetailPage({
  params
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  const [locale, user, sessionId] = await Promise.all([getLocale(), getCurrentUser(), getSessionIdFromHeaders()]);
  const [state, summary] = await Promise.all([readState(sessionId), getClassSummary(sessionId, classId)]);

  if (!summary) {
    notFound();
  }

  const isZh = locale === "zh-TW";
  const activeGoal = state.profile ? getActiveLearnerGoal(state) : undefined;
  const classInvites = state.classInvites.filter((invite) => invite.classroomId === classId);

  return (
    <AppShell activePath="/classes" locale={locale} userEmail={user?.email}>
      <section className="stack">
        <div className="panel-header">
          <div>
            <div className="eyebrow">{isZh ? "班級管理" : "Class management"}</div>
            <h1 className="page-title">{summary.classroom.title}</h1>
            <p className="subtle">{isZh ? "發布 goal template、產生家長邀請並查看加入摘要。" : "Publish goal templates, create parent invites, and monitor enrollment summary."}</p>
          </div>
          <Link className="button-secondary" href="/classes">{isZh ? "回班級列表" : "Back to classes"}</Link>
        </div>

        <div className="dashboard-grid">
          <div className="metric-card"><div className="metric-label subtle">{isZh ? "已加入" : "Joined"}</div><div className="metric-value">{summary.joinedCount}</div></div>
          <div className="metric-card"><div className="metric-label subtle">{isZh ? "模板" : "Templates"}</div><div className="metric-value">{summary.templateCount}</div></div>
          <div className="metric-card"><div className="metric-label subtle">{isZh ? "邀請" : "Invites"}</div><div className="metric-value">{summary.activeInviteCount}</div></div>
        </div>

        <div className="lesson-grid">
          <div className="review-card stack">
            <div className="eyebrow">{isZh ? "發布目前 active goal" : "Publish active goal"}</div>
            <h2 className="section-title">{activeGoal?.title ?? (isZh ? "尚未有 active goal" : "No active goal")}</h2>
            <p className="subtle">
              {activeGoal
                ? `${subjectDisplayLabel(activeGoal.subject ?? activeGoal.domain, locale)} · ${activeGoal.level} · ${activeGoal.dailyMinutes} min`
                : isZh ? "請先建立學習目標。" : "Create a learning goal first."}
            </p>
            <div className="button-row">
              <PublishGoalButton classId={classId} disabled={!activeGoal} locale={locale} />
            </div>
          </div>
          <div className="review-card stack">
            <div className="eyebrow">{isZh ? "班級 templates" : "Class templates"}</div>
            <div className="generated-plan-list">
              {summary.templates.length === 0 ? <p className="subtle">{isZh ? "尚未發布模板。" : "No templates yet."}</p> : null}
              {summary.templates.map((template) => (
                <article className="generated-plan-item" key={template.id}>
                  <div>
                    <h2 className="section-title">{template.title}</h2>
                    <p className="subtle">{subjectDisplayLabel(template.subject ?? template.domain, locale)} · v{template.templateVersion}</p>
                  </div>
                  <div className="button-row compact-button-row">
                    <CreateInviteButton classId={classId} locale={locale} templateId={template.id} />
                    <SyncTemplateButton classId={classId} locale={locale} templateId={template.id} />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div className="review-card stack">
          <div className="eyebrow">{isZh ? "邀請連結" : "Invite links"}</div>
          <div className="generated-plan-list">
            {classInvites.length === 0 ? <p className="subtle">{isZh ? "尚未產生邀請。" : "No invites yet."}</p> : null}
            {classInvites.map((invite) => (
              <article className="generated-plan-item" key={invite.id}>
                <div>
                  <h2 className="section-title">{invite.code}</h2>
                  <p className="subtle">/join/class/{invite.code}</p>
                </div>
                <Link className="button-secondary" href={`/join/class/${invite.code}`}>{isZh ? "預覽加入頁" : "Preview join page"}</Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
