import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { ClassroomCreateForm } from "@/components/classes/classroom-actions";
import { getLocale } from "@/lib/i18n-server";
import { getCurrentUser, getSessionIdFromHeaders } from "@/lib/session";
import { readState } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ClassesPage() {
  const [locale, user, sessionId] = await Promise.all([getLocale(), getCurrentUser(), getSessionIdFromHeaders()]);
  const state = await readState(sessionId);
  const isZh = locale === "zh-TW";

  return (
    <AppShell activePath="/classes" locale={locale} userEmail={user?.email}>
      <section className="stack">
        <div className="panel-header">
          <div>
            <div className="eyebrow">{isZh ? "班級" : "Classes"}</div>
            <h1 className="page-title">{isZh ? "班級 goal 派發" : "Class goal distribution"}</h1>
            <p className="subtle">
              {isZh
                ? "老師建立 goal template，家長用邀請連結為孩子建立獨立學習目標。"
                : "Teachers publish goal templates and parents use invite links to create isolated child goals."}
            </p>
          </div>
        </div>
        <div className="lesson-grid">
          <ClassroomCreateForm locale={locale} />
          <div className="review-card stack">
            <div className="eyebrow">{isZh ? "我的班級" : "My classes"}</div>
            <div className="generated-plan-list">
              {state.classrooms.length === 0 ? <p className="subtle">{isZh ? "尚未建立班級。" : "No classes yet."}</p> : null}
              {state.classrooms.map((classroom) => (
                <article className="generated-plan-item" key={classroom.id}>
                  <div>
                    <h2 className="section-title">{classroom.title}</h2>
                    <p className="subtle">{[classroom.schoolName, classroom.gradeBand].filter(Boolean).join(" · ") || (isZh ? "班級空間" : "Classroom")}</p>
                  </div>
                  <Link className="button" href={`/classes/${classroom.id}`}>{isZh ? "管理" : "Manage"}</Link>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
