import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { auth } from "@/lib/auth";
import { getQueryClient, trpc } from "@/trpc/server";
import { CallView } from "@/modules/call/ui/views/call-view";

interface Props {
  params: Promise<{ interviewId: string }>;
}

const CallInterviewPage = async ({ params }: Props) => {
  const { interviewId } = await params;
  
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(
    trpc.interviews.getOne.queryOptions({ id: interviewId }),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CallView interviewId={interviewId} />
    </HydrationBoundary>
  );
};

export default CallInterviewPage;