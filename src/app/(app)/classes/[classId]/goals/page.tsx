import { redirect } from "next/navigation";

export default async function ClassGoalsPage({
  params
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  redirect(`/classes/${classId}`);
}
