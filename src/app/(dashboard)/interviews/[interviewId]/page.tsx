import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { auth } from "@/lib/auth";
import { getQueryClient, trpc } from "@/trpc/server";
import { InterviewIdView, InterviewIdViewError, InterviewIdViewLoading } from "@/modules/interviews/ui/views/interview-id-view";

interface Props {
  params: Promise<{ interviewId: string }>;
}

const Page = async ({ params }: Props) => {
  const { interviewId } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(
    trpc.interviews.getOne.queryOptions({
      id: interviewId
    })
  )

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<InterviewIdViewLoading />}>
        <ErrorBoundary fallback={<InterviewIdViewError />}>
          <InterviewIdView interviewId={interviewId} />
        </ErrorBoundary>
      </Suspense>
    </HydrationBoundary>
  );
};

export default Page;