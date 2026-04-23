import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  const { next } = await searchParams;

  if (user) {
    redirect(next ?? "/dashboard");
  }

  redirect(`/?auth=signup${next ? `&next=${encodeURIComponent(next)}` : ""}`);
}
