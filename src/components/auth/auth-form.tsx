"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export function AuthForm({ nextPath = "/dashboard" }: { nextPath?: string }) {
  const supabase = createSupabaseBrowserClient();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signInWithGoogle() {
    setPending(true);
    setError(null);

    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo
      }
    });

    if (signInError) {
      setError(signInError.message);
      setPending(false);
    }
  }

  return (
    <div className="stack">
      <div className="muted-box">
        <strong>Access policy</strong>
        <div className="subtle">這個產品目前只接受 Google 帳號登入，不提供 email/password 或前台註冊。</div>
      </div>
      {error ? <div className="status">{error}</div> : null}
      <div className="button-row">
        <button className="button" disabled={pending} onClick={signInWithGoogle} type="button">
          {pending ? "導向 Google..." : "使用 Google 登入"}
        </button>
      </div>
    </div>
  );
}
