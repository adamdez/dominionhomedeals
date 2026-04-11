import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { OperationalProofPage } from "@/components/al/OperationalProofPage";
import { buildOperationalProofReport } from "@/lib/al-operational-proof";
import { buildHostedAppPrefix, isAuthenticatedAlSession } from "@/lib/al-review";

export const dynamic = "force-dynamic";

export default async function AlOperationalProofPage() {
  const cookieStore = await cookies();
  if (!isAuthenticatedAlSession(cookieStore.get("al_session")?.value)) {
    redirect("/");
  }

  const headerStore = await headers();
  const host = headerStore.get("host");
  const proto = headerStore.get("x-forwarded-proto") || "http";
  const origin = host ? `${proto}://${host}` : "https://al.dominionhomedeals.com";
  const report = await buildOperationalProofReport({ host, origin });

  return (
    <OperationalProofPage
      report={report}
      commandCenterPath={`${buildHostedAppPrefix(host) || ""}/`}
    />
  );
}
