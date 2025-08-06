"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { ErrorState } from "@/components/error-state";
import { CallProvider } from "@/modules/call/components/call-provider";

interface CallViewProps {
    interviewId: string;
}

export const CallView = ({ interviewId }: CallViewProps) => {
    const trpc = useTRPC();
    const { data } = useSuspenseQuery(
        trpc.interviews.getOne.queryOptions({
            id: interviewId
        })
    );

    if (data.status === "completed") {
        return (
            <div className="flex items-center justify-center h-screen">
                <ErrorState 
                    title = "Interview Completed"
                    description = "You no longer can join this meeting"
                />
            </div>
        )
    }

    return <CallProvider interviewId={data.id} interviewName={data.name} />
}