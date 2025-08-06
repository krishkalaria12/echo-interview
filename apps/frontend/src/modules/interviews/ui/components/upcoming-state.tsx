import Link from "next/link";
import { BanIcon, VideoIcon } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

interface UpcomingStateProps {
    interviewId: string;
    onCancelInterview: () => void;
    isCancelling: boolean;
}

export const UpcomingState = ({ interviewId, onCancelInterview, isCancelling }: UpcomingStateProps) => {
  return (
    <div className="bg-white rounded-lg px-4 py-5 flex flex-col gap-y-8 items-center justify-center">
        <EmptyState
            image="/upcoming.svg"
            title="No upcoming interviews"
            description="You don't have any upcoming interviews scheduled."
        />
        <div className="flex flex-col-reverse lg:flex-row lg:justify-center items-center gap-2 w-full">
            <Button variant={"secondary"} className="w-full lg:w-auto" onClick={onCancelInterview} disabled={isCancelling}>
                <BanIcon />
                Cancel Interview
            </Button>
            <Button asChild className="w-full lg:w-auto">
                <Link href={`/interviews/${interviewId}/start`}>
                    <VideoIcon />
                    Start Interview
                </Link>
            </Button>
        </div>
    </div>
  );
};