import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { WrenchReadyDayReadinessPage } from "@/components/al/WrenchReadyDayReadinessPage";
import { listPlannerTasks } from "@/lib/al-planner";
import { isAuthenticatedAlSession } from "@/lib/al-review";
import {
  getWrenchReadyDayReadiness,
  getWrenchReadyDayReadinessSummary,
} from "@/lib/wrenchready-day-readiness";

export const dynamic = "force-dynamic";

function tomorrowKey() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default async function AlWrenchReadyDayReadinessPage() {
  const cookieStore = await cookies();
  if (!isAuthenticatedAlSession(cookieStore.get("al_session")?.value)) {
    redirect("/");
  }

  const date = tomorrowKey();
  const [record, summary, tasks] = await Promise.all([
    getWrenchReadyDayReadiness(date),
    getWrenchReadyDayReadinessSummary(date),
    listPlannerTasks(),
  ]);

  const plannerTask =
    (record?.plannerTaskId
      ? tasks.find((task) => task.id === record.plannerTaskId)
      : null) ||
    tasks.find(
      (task) =>
        task.source === "wrenchready_day_readiness" &&
        task.title === `WrenchReady day readiness for ${date}`,
    ) ||
    null;

  return (
    <WrenchReadyDayReadinessPage
      initialDate={date}
      initialRecord={record}
      initialPlannerTask={plannerTask}
      initialSummaryText={summary.text}
    />
  );
}
