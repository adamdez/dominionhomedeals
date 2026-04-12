import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { AttentionPage } from "@/components/al/AttentionPage";
import { resolveAlOrigin } from "@/lib/al-platform";
import { buildAttentionBrief } from "@/lib/al-attention-brief";
import { buildHostedAppPrefix, isAuthenticatedAlSession } from "@/lib/al-review";

export const dynamic = "force-dynamic";

export default async function AlAttentionPage() {
  const cookieStore = await cookies();
  if (!isAuthenticatedAlSession(cookieStore.get("al_session")?.value)) {
    redirect("/");
  }

  const headerStore = await headers();
  const host = headerStore.get("host");
  const proto = headerStore.get("x-forwarded-proto") || "http";
  const origin = resolveAlOrigin({ host, proto });
  const brief = await buildAttentionBrief({ host, origin });

  return (
    <AttentionPage
      brief={brief}
      commandCenterPath={`${buildHostedAppPrefix(host) || ""}/`}
    />
  );
}
