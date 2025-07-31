"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";

import { NewInterviewDialog } from "@/modules/interviews/components/new-interview-dialog";
import { Button } from "@/components/ui/button";

export const InterviewsListHeader = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
        <NewInterviewDialog
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
        />
        <div className="py-4 px-4 md:px-8 flex flex-col gap-y-4">
        <div className="flex items-center justify-between">
            <h5 className="font-medium text-xl">My Interviews</h5>
            <Button
              onClick={() => setIsDialogOpen(true)}>
              <PlusIcon className="w-4 h-4 mr-2" />
              New Interview
            </Button>
        </div>
        <div className="flex items-center gap-x-2 p-1">
            TODO: Filters
        </div>
        </div>
    </>
  );
};
