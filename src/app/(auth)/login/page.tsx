import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { getLocaleCopy } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { getCurrentUser } from "@/lib/session";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  const { next } = await searchParams;
  const locale = await getLocale();
  const copy = getLocaleCopy(locale);

  if (user) {
    redirect(next ?? "/dashboard");
  }

  return (
    <main className="shell" style={{ paddingTop: 80 }}>
      <div className="review-card" style={{ maxWidth: 560, margin: "0 auto" }}>
        <div className="eyebrow">{copy.auth.eyebrow}</div>
        <h1 className="section-title">{copy.auth.loginTitle}</h1>
        <p className="subtle">{copy.auth.loginBody}</p>
        <AuthForm locale={locale} nextPath={next ?? "/dashboard"} submitLabel={copy.auth.signIn} />
        <p className="subtle" style={{ marginTop: 16 }}>
          {copy.auth.noAccount}
          <Link href={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"}>{copy.auth.goSignup}</Link>
        </p>
      </div>
    </main>
  );
}
