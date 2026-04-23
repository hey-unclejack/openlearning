"use client";

import { ChangeEvent, FormEvent, startTransition, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { AppLocale, getLocaleCopy } from "@/lib/i18n";
import { ToastNotice } from "@/components/ui/toast-notice";

function EditIcon() {
  return (
    <svg aria-hidden="true" className="profile-edit-icon" viewBox="0 0 20 20">
      <path d="m14.7 2.3 3 3-9.4 9.4-3.8.8.8-3.8 9.4-9.4ZM13.3 3.7 6.6 10.4l-.4 1.8 1.8-.4 6.7-6.7-1.4-1.4Z" fill="currentColor" />
    </svg>
  );
}

const AVATAR_COOKIE_NAME = "openlearning_avatar_url";

async function compressAvatarImage(file: File) {
  if (!file.type.startsWith("image/")) {
    return file;
  }

  const imageUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("image_load_failed"));
      img.src = imageUrl;
    });

    const maxSide = 1024;
    const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");

    if (!context) {
      return file;
    }

    context.drawImage(image, 0, 0, width, height);

    const attempts = [0.9, 0.82, 0.74, 0.66, 0.58, 0.5, 0.42];

    for (const quality of attempts) {
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/jpeg", quality);
      });

      if (!blob) {
        continue;
      }

      if (blob.size <= 1.8 * 1024 * 1024) {
        return new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "avatar"}.jpg`, {
          type: "image/jpeg"
        });
      }
    }

    const fallbackBlob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.36);
    });

    if (!fallbackBlob) {
      return file;
    }

    return new File([fallbackBlob], `${file.name.replace(/\.[^.]+$/, "") || "avatar"}.jpg`, {
      type: "image/jpeg"
    });
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

export function ProfileForm({
  locale,
  initialName,
  initialAvatarUrl,
  email,
  userId,
  achievements
}: {
  locale: AppLocale;
  initialName: string;
  initialAvatarUrl?: string;
  email?: string;
  userId?: string;
  achievements: Array<{ label: string; current: number; target: number; unlocked: boolean }>;
}) {
  const copy = getLocaleCopy(locale);
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const defaultAvatarUrl = "/default-profile-avatar.svg";
  const [name, setName] = useState(initialName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl || defaultAvatarUrl);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPending, setAvatarPending] = useState(false);
  const [namePending, setNamePending] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<"success" | "error">("success");

  async function persistProfile({
    nextName,
    nextAvatarFile,
    nextAvatarUrl
  }: {
    nextName?: string;
    nextAvatarFile?: File | null;
    nextAvatarUrl?: string;
  }) {
    const formData = new FormData();
    formData.set("displayName", (nextName ?? name).trim());
    if (nextAvatarFile) {
      formData.set("avatar", nextAvatarFile);
    } else {
      formData.set("avatarUrl", (nextAvatarUrl ?? avatarUrl).trim());
    }

    const response = await fetch("/api/profile", {
      method: "POST",
      body: formData
    });

    const payload = (await response.json().catch(() => null)) as {
      ok?: boolean;
      error?: string;
      profile?: {
        displayName?: string | null;
        avatarUrl?: string | null;
      };
    } | null;

    if (!response.ok || !payload?.ok) {
      setStatusTone("error");
      setStatus(payload?.error || copy.profilePage.saveError);
      return false;
    }

    if (typeof payload.profile?.displayName === "string") {
      setName(payload.profile.displayName);
    }

    if (typeof payload.profile?.avatarUrl === "string" && payload.profile.avatarUrl) {
      setAvatarUrl(payload.profile.avatarUrl);
      document.cookie = `${AVATAR_COOKIE_NAME}=${encodeURIComponent(payload.profile.avatarUrl)}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
    }

    setStatusTone("success");
    setStatus(copy.profilePage.saveSuccess);

    startTransition(() => {
      router.refresh();
    });

    return true;
  }

  async function onNameSubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (namePending) {
      return;
    }

    setNamePending(true);
    setStatus(null);
    const ok = await persistProfile({ nextName: name });
    setNamePending(false);

    if (ok) {
      setEditingName(false);
    }
  }

  async function onAvatarSelected(file?: File) {
    if (!file) {
      return;
    }

    const compressedFile = await compressAvatarImage(file);

    setAvatarFile(compressedFile);
    setAvatarPending(true);
    setStatus(null);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(compressedFile);

    const ok = await persistProfile({ nextAvatarFile: compressedFile });
    setAvatarPending(false);

    if (ok) {
      setAvatarFile(null);
      window.location.reload();
    }
  }

  function onAvatarInputChange(event: ChangeEvent<HTMLInputElement>) {
    void onAvatarSelected(event.target.files?.[0]);
  }

  return (
    <div className="profile-stack">
      <ToastNotice message={status} tone={statusTone} />
      <div className="review-card stack">
        <div className="stack">
          <div className="eyebrow">{copy.profilePage.infoEyebrow}</div>
        </div>
        <div className="profile-hero">
          <div className="profile-avatar-wrap">
            <img
              alt={name || email || "Profile"}
              className="profile-page-avatar"
              onError={(event) => {
                if (event.currentTarget.src !== window.location.origin + defaultAvatarUrl) {
                  setAvatarUrl(defaultAvatarUrl);
                }
              }}
              src={avatarUrl || defaultAvatarUrl}
            />
            <button
              aria-label={copy.profilePage.editAvatar}
              className="profile-icon-button profile-avatar-edit"
              disabled={avatarPending}
              onClick={() => avatarInputRef.current?.click()}
              type="button"
            >
              <EditIcon />
            </button>
            <input
              accept="image/*"
              className="profile-upload-input"
              id="avatarUpload"
              onChange={onAvatarInputChange}
              ref={avatarInputRef}
              type="file"
            />
          </div>
          <div className="stack profile-hero-copy">
            {editingName ? (
              <form className="profile-name-form" onSubmit={onNameSubmit}>
                <input
                  autoFocus
                  className="profile-name-input"
                  onBlur={() => void onNameSubmit()}
                  onChange={(event) => setName(event.target.value)}
                  value={name}
                />
              </form>
            ) : (
              <div className="profile-name-row">
                <strong>{name || copy.profilePage.noName}</strong>
                <button
                  aria-label={copy.profilePage.editName}
                  className="profile-icon-button"
                  disabled={namePending}
                  onClick={() => setEditingName(true)}
                  type="button"
                >
                  <EditIcon />
                </button>
              </div>
            )}
            <span className="support-label profile-uid-value">{userId || "-"}</span>
          </div>
        </div>
        <div className="profile-static-grid profile-static-grid-single">
          <div className="muted-box profile-static-item profile-account-row">
            <div className="stack profile-account-copy">
              <span className="support-label">{copy.profilePage.loginAccount}</span>
              <strong>{email || "-"}</strong>
            </div>
            <SignOutButton className="button-secondary profile-signout-button" locale={locale} />
          </div>
        </div>
      </div>
      <div className="review-card stack">
        <div className="stack">
          <div className="eyebrow">{copy.profilePage.achievementEyebrow}</div>
        </div>
        <div className="profile-achievement-list">
          {achievements.map((achievement) => (
            <div key={achievement.label} className={`profile-achievement-card${achievement.unlocked ? " unlocked" : ""}`}>
              <div className="profile-achievement-head">
                <span className="profile-achievement-badge">{achievement.unlocked ? "●" : "○"}</span>
                <div className="profile-achievement-copy">
                  <strong>{achievement.label}</strong>
                  <span className="support-label">
                    {achievement.unlocked ? copy.profilePage.badgeUnlocked : copy.profilePage.badgeLocked}
                  </span>
                </div>
                <span className="profile-achievement-progress-label">
                  {copy.profilePage.badgeProgress(achievement.current, achievement.target)}
                </span>
              </div>
              <div className="profile-achievement-progress">
                <span
                  className="profile-achievement-progress-bar"
                  style={{ width: `${Math.max(8, Math.min(100, (achievement.current / achievement.target) * 100))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
