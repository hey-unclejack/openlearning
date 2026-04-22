import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { getCurrentUser } from "@/lib/session";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  const { next } = await searchParams;

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="shell" style={{ paddingTop: 80 }}>
      <div className="review-card" style={{ maxWidth: 560, margin: "0 auto" }}>
        <div className="eyebrow">Supabase Auth</div>
        <h1 className="section-title">登入你的學習帳號</h1>
        <p className="subtle">只接受 Google 登入。未登入使用者無法進入學習區。</p>
        <AuthForm nextPath={next ?? "/dashboard"} />
      </div>
    </main>
  );
}
