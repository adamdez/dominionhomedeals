import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DominionLeadsPage } from "@/components/al/DominionLeadsPage";
import { getDominionLeadDashboard } from "@/lib/dominion-leads";
import { isAuthenticatedAlSession } from "@/lib/al-review";

export const dynamic = "force-dynamic";

export default async function AlDominionLeadsPage() {
  const cookieStore = await cookies();
  if (!isAuthenticatedAlSession(cookieStore.get("al_session")?.value)) {
    redirect("/");
  }

  const dashboard = await getDominionLeadDashboard(24);

  return <DominionLeadsPage initialDashboard={dashboard} />;
}
