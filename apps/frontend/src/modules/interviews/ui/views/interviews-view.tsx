'use client';

import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { columns } from "@/modules/interviews/ui/components/columns";

export const InterviewsView = () => {
    const trpc = useTRPC();
    const { data } = useSuspenseQuery(trpc.interviews.getMany.queryOptions({}))

    return (
        <div className="flex-1 pb-4 px-4 md:px-8 flex flex-col gap-y-4">
            <DataTable columns={columns} data={data?.items} />
            {data?.items?.length === 0 && (
                <EmptyState
                    title="Create your first interview"
                    description="Create an interview to start recording and analyzing your conversations. Each interview will be saved and can be reviewed later."
                />
            )}
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