"use client";

import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export function SignOutButton() {
  const router = useRouter();

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
      Sign out
    </button>
  );
}
