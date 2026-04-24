"use client";

import { useRouter } from "next/navigation";
import { FormEvent, startTransition, useState } from "react";
import { AppLocale } from "@/lib/i18n";

export function ClassroomCreateForm({ locale }: { locale: AppLocale }) {
  const router = useRouter();
  const isZh = locale === "zh-TW";
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    const response = await fetch("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: String(form.get("title") ?? ""),
        schoolName: String(form.get("schoolName") ?? ""),
        gradeBand: String(form.get("gradeBand") ?? ""),
      }),
    });
    const payload = await response.json() as { ok: boolean; classroom?: { id: string }; error?: string };
    setPending(false);

    if (!payload.ok || !payload.classroom) {
      setError(payload.error ?? "Failed to create class.");
      return;
    }

    startTransition(() => {
      router.push(`/classes/${payload.classroom!.id}`);
      router.refresh();
    });
  }

  return (
    <form className="review-card stack" onSubmit={onSubmit}>
      <div>
        <div className="eyebrow">{isZh ? "建立班級" : "Create class"}</div>
        <h2 className="section-title">{isZh ? "開一個班級空間" : "Open a classroom space"}</h2>
      </div>
      <label className="field">
        {isZh ? "班級名稱" : "Class title"}
        <input name="title" placeholder={isZh ? "例如：三年甲班" : "e.g. Grade 3 Class A"} required />
      </label>
      <label className="field">
        {isZh ? "學校名稱" : "School name"}
        <input name="schoolName" />
      </label>
      <label className="field">
        {isZh ? "年級 / 學制" : "Grade band"}
        <input name="gradeBand" placeholder={isZh ? "例如：國小三年級" : "e.g. Grade 3"} />
      </label>
      {error ? <div className="toast-inline error">{error}</div> : null}
      <div className="button-row">
        <button className="button" disabled={pending} type="submit">
          {pending ? (isZh ? "建立中..." : "Creating...") : (isZh ? "建立班級" : "Create class")}
        </button>
      </div>
    </form>
  );
}

export function PublishGoalButton({
  classId,
  locale,
  disabled,
}: {
  classId: string;
  locale: AppLocale;
  disabled?: boolean;
}) {
  const router = useRouter();
  const isZh = locale === "zh-TW";
  const [pending, setPending] = useState(false);

  async function publish() {
    setPending(true);
    await fetch(`/api/classes/${classId}/goals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setPending(false);
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <button className="button" disabled={disabled || pending} onClick={publish} type="button">
      {pending ? (isZh ? "發布中..." : "Publishing...") : (isZh ? "發布目前目標為班級模板" : "Publish active goal as class template")}
    </button>
  );
}

export function CreateInviteButton({
  classId,
  templateId,
  locale,
}: {
  classId: string;
  templateId: string;
  locale: AppLocale;
}) {
  const router = useRouter();
  const isZh = locale === "zh-TW";
  const [pending, setPending] = useState(false);

  async function createInvite() {
    setPending(true);
    await fetch(`/api/classes/${classId}/invites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId }),
    });
    setPending(false);
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <button className="button-secondary" disabled={pending} onClick={createInvite} type="button">
      {pending ? (isZh ? "產生中..." : "Creating...") : (isZh ? "產生邀請連結" : "Create invite link")}
    </button>
  );
}

export function SyncTemplateButton({
  classId,
  templateId,
  locale,
}: {
  classId: string;
  templateId: string;
  locale: AppLocale;
}) {
  const router = useRouter();
  const isZh = locale === "zh-TW";
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function syncTemplate() {
    setPending(true);
    setMessage("");
    const response = await fetch(`/api/classes/${classId}/templates/${templateId}/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const payload = await response.json() as {
      ok: boolean;
      syncedChildGoalCount?: number;
      syncedPlanCount?: number;
      error?: string;
    };
    setPending(false);

    if (!payload.ok) {
      setMessage(payload.error ?? (isZh ? "同步失敗" : "Sync failed"));
      return;
    }

    setMessage(
      isZh
        ? `已同步 ${payload.syncedChildGoalCount ?? 0} 位孩子`
        : `Synced ${payload.syncedChildGoalCount ?? 0} child goals`,
    );
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="stack compact-action-stack">
      <button className="button-secondary" disabled={pending} onClick={syncTemplate} type="button">
        {pending ? (isZh ? "同步中..." : "Syncing...") : (isZh ? "同步到已加入孩子" : "Sync to enrolled children")}
      </button>
      {message ? <p className="subtle">{message}</p> : null}
    </div>
  );
}
