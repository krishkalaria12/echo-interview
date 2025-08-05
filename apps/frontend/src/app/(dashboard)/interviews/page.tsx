import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ErrorBoundary } from "react-error-boundary";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { SearchParams } from "nuqs";

import { loadSearchParams } from "@/modules/interviews/params";
import { getQueryClient, trpc } from "@/trpc/server";
import { InterviewsView, InterviewsViewError, InterviewsViewLoading } from "@/modules/interviews/ui/views/interviews-view"
import { auth } from "@/lib/auth";
import { InterviewsListHeader } from "@/modules/interviews/ui/components/interviews-list-header";

interface InterviewPageProps {
  searchParams: Promise<SearchParams>;
}

const InterviewPage = async ({ searchParams }: InterviewPageProps) => {
  const filters = await loadSearchParams(searchParams);

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(
    trpc.interviews.getMany.queryOptions({
      ...filters,
    })
  );

  const dehydratedState = dehydrate(queryClient);

  return (
    <>
      <InterviewsListHeader />
      <HydrationBoundary state={dehydratedState}>
        <Suspense fallback={<InterviewsViewLoading />}>
          <ErrorBoundary fallback={<InterviewsViewError />}>
            <InterviewsView />
          </ErrorBoundary>
        </Suspense>
      </HydrationBoundary>
    </>
  )
}

export default InterviewPage