"use client";

import { useRouter } from "next/navigation";
import { ComponentProps } from "react";
import { AppLocale, getLocaleCopy } from "@/lib/i18n";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export function SignOutButton({
  locale,
  className = "ghost-button"
}: {
  locale: AppLocale;
  className?: ComponentProps<"button">["className"];
}) {
  const router = useRouter();
  const copy = getLocaleCopy(locale);

  return (
    <button
      className={className}
      onClick={async () => {
        const supabase = createSupabaseBrowserClient();
        await supabase.auth.signOut();
        router.push("/");
        router.refresh();
      }}
      type="button"
    >
      {copy.appShell.signOut}
    </button>
  );
}
