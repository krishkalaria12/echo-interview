import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { getQueryClient, trpc } from "@/trpc/server";
import { InterviewsView, InterviewsViewError, InterviewsViewLoading } from "@/modules/interviews/ui/views/interviews-view"

const InterviewPage = () => {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(
    trpc.interviews.getMany.queryOptions({})
  );

  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <Suspense fallback={<InterviewsViewLoading />}>
        <ErrorBoundary fallback={<InterviewsViewError />}>
          <InterviewsView />
        </ErrorBoundary>
      </Suspense>
    </HydrationBoundary>
  )
}

export default InterviewPage