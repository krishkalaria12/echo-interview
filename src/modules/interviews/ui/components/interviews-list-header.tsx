"use client";

import { useState } from "react";
import { PlusIcon, XCircleIcon } from "lucide-react";

import { NewInterviewDialog } from "@/modules/interviews/ui/components/new-interview-dialog";
import { InterviewsSearchFilter } from "@/modules/interviews/ui/components/interviews-search-filter";
import { StatusFilter } from "@/modules/interviews/ui/components/status-filters";
import { useInterviewsFilters } from "@/modules/interviews/hooks/use-interviews-filter";
import { Button } from "@/components/ui/button";

export const InterviewsListHeader = () => {
  const [filters, setFilters] = useInterviewsFilters();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const isAnyFilterModified = !!filters.search || !!filters.status;

  const onClearFilters = () => {
    setFilters({
      search: "",
      status: null,
      page: 1,
    });
  };

  return (
    <>
      <NewInterviewDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
      <div className="py-4 px-4 md:px-8 flex flex-col gap-y-4">
        <div className="flex items-center justify-between">
          <h5 className="font-medium text-xl">My Interviews</h5>
          <Button onClick={() => setIsDialogOpen(true)}>
            <PlusIcon className="w-4 h-4 mr-2" />
            New Interview
          </Button>
        </div>
        <div className="flex items-center gap-x-2 p-1">
          <InterviewsSearchFilter />
          <StatusFilter />
          {isAnyFilterModified && (
            <Button variant="outline" onClick={onClearFilters} className="h-9">
              <XCircleIcon className="size-4" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>
    </>
  );
};
