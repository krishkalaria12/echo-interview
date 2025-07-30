'use client';

import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";

export const InterviewsView = () => {
    const trpc = useTRPC();
    const { data } = useSuspenseQuery(trpc.interviews.getMany.queryOptions({}))

    return (
        <div>
            {JSON.stringify(data?.items)}
        </div>
    )
}

export const InterviewsViewLoading = () => {
    return (
        <LoadingState 
            title="Loading interviews..."
            description="Please wait while we load the interviews..."
        />
    )
}

export const InterviewsViewError = () => {
    return (
        <ErrorState
            title="Error loading interviews..."
            description="Please try again later."
        />
    )
}