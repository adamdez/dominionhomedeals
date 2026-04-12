import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { InboxPage } from "@/components/al/InboxPage";
import { listInboxItems } from "@/lib/al-inbox";
import { isAuthenticatedAlSession } from "@/lib/al-review";

export const dynamic = "force-dynamic";

export default async function AlInboxPage() {
  const cookieStore = await cookies();
  if (!isAuthenticatedAlSession(cookieStore.get("al_session")?.value)) {
    redirect("/");
  }

  const items = await listInboxItems();
  return <InboxPage initialItems={items} />;
}
