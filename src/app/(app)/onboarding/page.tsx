import { redirect } from "next/navigation";

export default async function LegacyOnboardingPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string; edit?: string; updated?: string }>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();

  if (params.next) query.set("next", params.next);
  if (params.edit) query.set("edit", params.edit);
  if (params.updated) query.set("updated", params.updated);

  redirect(query.size ? `/profile/goals?${query.toString()}` : "/profile/goals");
}
