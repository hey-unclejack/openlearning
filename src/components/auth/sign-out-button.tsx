"use client";

import { useRouter } from "next/navigation";
import { AppLocale, getLocaleCopy } from "@/lib/i18n";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export function SignOutButton({ locale }: { locale: AppLocale }) {
  const router = useRouter();
  const copy = getLocaleCopy(locale);

  return (
    <button
      className="ghost-button"
      onClick={async () => {
        const supabase = createSupabaseBrowserClient();
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
      }}
      type="button"
    >
      {copy.appShell.signOut}
    </button>
  );
}
