import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { LaborLanesPage } from "@/components/al/LaborLanesPage";
import { buildLaborLaneReport } from "@/lib/al-labor-lanes";
import { buildHostedAppPrefix, isAuthenticatedAlSession } from "@/lib/al-review";

export const dynamic = "force-dynamic";

export default async function AlLaborLanesPage() {
  const cookieStore = await cookies();
  if (!isAuthenticatedAlSession(cookieStore.get("al_session")?.value)) {
    redirect("/");
  }

  const headerStore = await headers();
  const host = headerStore.get("host");
  const proto = headerStore.get("x-forwarded-proto") || "http";
  const origin = host ? `${proto}://${host}` : "https://al.dominionhomedeals.com";
  const report = await buildLaborLaneReport({ host, origin });

  return (
    <LaborLanesPage
      report={report}
      commandCenterPath={`${buildHostedAppPrefix(host) || ""}/`}
    />
  );
}
