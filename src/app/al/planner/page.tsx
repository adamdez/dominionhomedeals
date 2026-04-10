import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PlannerPage } from "@/components/al/PlannerPage";
import { listPlannerTasks } from "@/lib/al-planner";
import { isAuthenticatedAlSession } from "@/lib/al-review";

export default async function AlPlannerPage() {
  const cookieStore = await cookies();
  if (!isAuthenticatedAlSession(cookieStore.get("al_session")?.value)) {
    redirect("/");
  }

  const tasks = await listPlannerTasks();
  return <PlannerPage initialTasks={tasks} />;
}
