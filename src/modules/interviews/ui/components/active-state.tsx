import Link from "next/link";
import { VideoIcon } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

interface ActiveStateProps {
    interviewId: string;
}

export const ActiveState = ({ interviewId }: ActiveStateProps) => {
  return (
    <div className="bg-white rounded-lg px-4 py-5 flex flex-col gap-y-8 items-center justify-center">
        <EmptyState
            image="/active.svg"
            title="No active interviews"
            description="You don't have any active interviews scheduled."
        />
        <div className="flex flex-col-reverse lg:flex-row lg:justify-center items-center gap-2 w-full">
            <Button asChild className="w-full lg:w-auto">
                <Link href={`/interviews/${interviewId}/start`}>
                    <VideoIcon />
                    Join Interview
                </Link>
            </Button>
        </div>
    </div>
  );
};