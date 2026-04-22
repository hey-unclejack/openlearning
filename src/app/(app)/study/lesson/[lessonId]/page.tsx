import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PracticeTrainer } from "@/components/study/practice-trainer";
import { readState } from "@/lib/store";
import { getCurrentUser, getSessionIdFromHeaders } from "@/lib/session";

export default async function LessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const sessionId = await getSessionIdFromHeaders();
  const user = await getCurrentUser();
  const state = await readState(sessionId);
  const lesson = state.lessons[lessonId];
  const planDay = state.plan.find((item) => `lesson-${item.id}` === lessonId);

  if (!lesson || !planDay) {
    notFound();
  }

  return (
    <AppShell activePath="/study/today" userEmail={user?.email}>
      <section className="stack">
        <div className="panel-header">
          <div>
            <div className="eyebrow">Lesson {planDay.dayNumber}</div>
            <h1 className="page-title">{planDay.title}</h1>
            <p className="lede">{planDay.objective}</p>
          </div>
        </div>

        <div className="lesson-grid">
          <div className="review-card">
            <h3 className="section-title">Vocabulary</h3>
            <ul className="list">
              {planDay.vocabulary.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="review-card">
            <h3 className="section-title">Chunks</h3>
            <ul className="list">
              {planDay.chunks.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="review-card">
          <div className="eyebrow">Dialogue</div>
          <ul className="dialogue-list">
            {planDay.dialogue.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>

        <div className="review-card">
          <div className="eyebrow">Coach note</div>
          <p className="subtle">{lesson.coachingNote}</p>
        </div>

        <PracticeTrainer questions={lesson.practice} />
      </section>
    </AppShell>
  );
}
