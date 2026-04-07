import { BoardroomPresentationPage } from "@/components/al/BoardroomPresentationPage";

export default async function HostedBoardroomPresentationRoute(
  props: { params: Promise<{ jobId: string }> },
) {
  const { jobId: rawJobId } = await props.params;
  return <BoardroomPresentationPage jobId={Number(rawJobId)} />;
}
