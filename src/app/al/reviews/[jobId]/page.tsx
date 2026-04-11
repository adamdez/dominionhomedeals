import { BoardroomPresentationPage } from "@/components/al/BoardroomPresentationPage";

export const dynamic = "force-dynamic";

export default async function LegacyAlReviewRoute(
  props: { params: Promise<{ jobId: string }> },
) {
  const { jobId: rawJobId } = await props.params;
  return <BoardroomPresentationPage jobId={Number(rawJobId)} />;
}
